// Moderation queue for admins: nothing reaches the catalog without an explicit approval.
import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { ProductStatus } from "../generated/prisma/enums.ts";
import { ActionError, handle, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { idParams } from "../validators/common.validators.js";
import { adminProductsQuery, rejectSchema } from "../validators/product.validators.js";
import { managedProductSelect, toManagedProduct } from "../services/serializers.js";

const adminSelect = { ...managedProductSelect, seller: { select: { id: true, name: true, email: true } } };

// GET /api/admin/products?status=PENDING&q=&page=&limit=
export const listProductsForModeration = handle(async (req, res) => {
  const { page, limit, status, q } = parse(adminProductsQuery, req.query);
  const where = { ...(status && { status }), ...(q && { name: { contains: q, mode: "insensitive" } }) };
  // The review queue is first-in-first-out; every other view shows newest first.
  const createdAt = status === ProductStatus.PENDING ? "asc" : "desc";

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, select: adminSelect, orderBy: [{ createdAt }, { id: "asc" }], ...pageArgs(page, limit) }),
    prisma.product.count({ where }),
  ]);
  res.json({ products: rows.map(toManagedProduct), meta: pageMeta(page, limit, total) });
});

async function moderate(req, res, decision) {
  const { id } = parse(idParams, req.params);
  const body = decision === ProductStatus.REJECTED ? parse(rejectSchema, req.body) : null;

  const before = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, status: true, sellerId: true } });
  if (!before) throw new ActionError(404, "Product not found");

  // Approving something already approved is a harmless repeat, not an error.
  if (decision === ProductStatus.APPROVED && before.status === ProductStatus.APPROVED) {
    const product = await prisma.product.findUnique({ where: { id }, select: adminSelect });
    return res.json({ product: toManagedProduct(product), changed: false });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      status: decision,
      rejectionReason: body ? body.reason : null,
      reviewedById: req.user.id,
      reviewedAt: new Date(),
    },
    select: adminSelect,
  });

  audit("PRODUCT_MODERATED", req, {
    productId: id,
    productName: before.name,
    sellerId: before.sellerId,
    decision,
    fromStatus: before.status,
    ...(body && { rejectReason: body.reason }),
  });
  res.json({ product: toManagedProduct(product), changed: true });
}

// POST /api/admin/products/:id/approve
export const approveProduct = handle((req, res) => moderate(req, res, ProductStatus.APPROVED));

// POST /api/admin/products/:id/reject   body: { "reason": "..." }   (also takes down an approved product)
export const rejectProduct = handle((req, res) => moderate(req, res, ProductStatus.REJECTED));
