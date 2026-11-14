import { z } from "zod";
import { ProductStatus } from "../generated/prisma/enums.ts";
import { limitField, pageField } from "../utils/pagination.js";

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:"; // never javascript:, data: ...
    } catch {
      return false;
    }
  }, "Must be an http(s) URL");

// Field rules in one place. No defaults here, so the PATCH schema (a partial of this) can never
// silently reset a field the client did not send.
const fields = {
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().max(2000),
  imageUrl: httpUrl.nullable(),
  price: z.number().int().min(500).max(10_000_000),
  discountPct: z.number().int().min(0).max(90),
  stock: z.number().int().min(0).max(100_000),
  isActive: z.boolean(),
};

// Strict: sellerId, status, rejectionReason... are rejected with 400 instead of being ignored.
export const createProductSchema = z.strictObject({
  name: fields.name,
  category: fields.category,
  price: fields.price,
  description: fields.description.default(""),
  imageUrl: fields.imageUrl.default(null),
  discountPct: fields.discountPct.default(0),
  stock: fields.stock.default(0),
});

export const updateProductSchema = z
  .strictObject(fields)
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field is required" });

export const rejectSchema = z.strictObject({ reason: z.string().trim().min(3).max(500) });

const search = z.string().trim().max(80).optional();
const productStatus = z.enum(Object.values(ProductStatus)).optional();

export const catalogQuery = z.object({
  page: pageField,
  limit: limitField(12, 50),
  q: search,
  category: z.string().trim().max(40).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("newest"),
});

export const sellerProductsQuery = z.object({ page: pageField, limit: limitField(20, 100), status: productStatus, q: search });
export const adminProductsQuery = z.object({ page: pageField, limit: limitField(20, 100), status: productStatus, q: search });
