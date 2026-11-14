// Public catalog. No login needed to browse; buying requires a CUSTOMER account.
import { prisma } from "../config/prisma.js";
import { handle, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { idParams } from "../validators/common.validators.js";
import { catalogQuery } from "../validators/product.validators.js";
import { purchasableWhere } from "../services/productRules.js";
import { publicProductSelect, toPublicProduct } from "../services/serializers.js";
import { ActionError } from "../utils/http.js";

const SORTS = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "asc" }],
  name: [{ name: "asc" }, { id: "asc" }],
};

// GET /api/products?page=&limit=&q=&category=&sort=
export const listProducts = handle(async (req, res) => {
  const { page, limit, q, category, sort } = parse(catalogQuery, req.query);
  const where = {
    ...purchasableWhere,
    ...(q && { name: { contains: q, mode: "insensitive" } }),
    ...(category && { category: { equals: category, mode: "insensitive" } }),
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, select: publicProductSelect, orderBy: SORTS[sort], ...pageArgs(page, limit) }),
    prisma.product.count({ where }),
  ]);
  res.json({ products: rows.map(toPublicProduct), meta: pageMeta(page, limit, total) });
});

// GET /api/products/categories
export const listCategories = handle(async (_req, res) => {
  const rows = await prisma.product.findMany({
    where: purchasableWhere,
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  res.json({ categories: rows.map((r) => r.category) });
});

// GET /api/products/:id
export const getProduct = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const product = await prisma.product.findFirst({ where: { id, ...purchasableWhere }, select: publicProductSelect });
  if (!product) throw new ActionError(404, "Product not found");
  res.json({ product: toPublicProduct(product) });
});
