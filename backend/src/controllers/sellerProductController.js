// A seller's own catalog: create, read, update, delete. Ownership is enforced on every id-based call.
import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { ProductStatus } from "../generated/prisma/enums.ts";
import { ActionError, assertOwner, handle, isForeignKeyViolation, isUniqueViolation, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { makeSlug } from "../utils/slug.js";
import { idParams } from "../validators/common.validators.js";
import { createProductSchema, sellerProductsQuery, updateProductSchema } from "../validators/product.validators.js";
import { managedProductSelect, toManagedProduct } from "../services/serializers.js";

// Changing what the product IS (not its price or stock) sends it back to moderation.
// Otherwise a seller could get "Brownies" approved and later rename it into something else.
const CONTENT_FIELDS = ["name", "category", "description", "imageUrl"];

async function loadOwned(req, id) {
  const product = await prisma.product.findUnique({ where: { id }, select: managedProductSelect });
  assertOwner(req, product, product?.sellerId, "Product");
  return product;
}

// GET /api/seller/products?page=&limit=&status=&q=
export const listMyProducts = handle(async (req, res) => {
  const { page, limit, status, q } = parse(sellerProductsQuery, req.query);
  const where = { sellerId: req.user.id, ...(status && { status }), ...(q && { name: { contains: q, mode: "insensitive" } }) };
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, select: managedProductSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageArgs(page, limit) }),
    prisma.product.count({ where }),
  ]);
  res.json({ products: rows.map(toManagedProduct), meta: pageMeta(page, limit, total) });
});

// GET /api/seller/products/:id
export const getMyProduct = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ product: toManagedProduct(await loadOwned(req, id)) });
});

// POST /api/seller/products   (new products always start as PENDING)
export const createProduct = handle(async (req, res) => {
  const input = parse(createProductSchema, req.body);

  let product;
  for (let attempt = 1; ; attempt++) {
    try {
      product = await prisma.product.create({
        // sellerId and status come from the session and the server, never from the body.
        data: { ...input, sellerId: req.user.id, slug: makeSlug(input.name), status: ProductStatus.PENDING },
        select: managedProductSelect,
      });
      break;
    } catch (err) {
      if (!isUniqueViolation(err) || attempt >= 3) throw err; // random slug suffix collided, try another
    }
  }

  audit("PRODUCT_CREATED", req, { productId: product.id, productName: product.name });
  res.status(201).json({ product: toManagedProduct(product) });
});

// PATCH /api/seller/products/:id
export const updateProduct = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(updateProductSchema, req.body);
  const current = await loadOwned(req, id);

  const data = { ...body };
  const contentChanged = CONTENT_FIELDS.some((k) => k in body && body[k] !== current[k]);
  const resubmitted = contentChanged && current.status !== ProductStatus.PENDING;
  if (resubmitted) {
    Object.assign(data, { status: ProductStatus.PENDING, rejectionReason: null, reviewedById: null, reviewedAt: null });
  }

  const product = await prisma.product.update({
    where: { id, sellerId: req.user.id }, // ownership is part of the write itself
    data,
    select: managedProductSelect,
  });

  audit("PRODUCT_UPDATED", req, { productId: id, fields: Object.keys(body).join(","), resubmitted });
  res.json({ product: toManagedProduct(product), resubmitted });
});

// DELETE /api/seller/products/:id
export const deleteProduct = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const current = await loadOwned(req, id);

  const hasHistory = () =>
    new ActionError(409, "Product has order history and cannot be deleted. Hide it instead (isActive: false).", {
      reason: "HAS_ORDERS",
    });
  if ((await prisma.orderItem.count({ where: { productId: id } })) > 0) throw hasHistory();

  try {
    await prisma.product.delete({ where: { id, sellerId: req.user.id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) throw hasHistory(); // an order was placed a split second ago
    throw err;
  }

  audit("PRODUCT_DELETED", req, { productId: id, productName: current.name });
  res.status(204).end();
});
