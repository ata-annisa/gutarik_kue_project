import { z } from "zod";
import { DeliveryMethod, OrderStatus } from "../generated/prisma/enums.ts";
import { limitField, pageField } from "../utils/pagination.js";

const DAY_MS = 86_400_000;
const MAX_DAYS_AHEAD = 90;

// "YYYY-MM-DD", from today up to 90 days ahead (UTC calendar days).
const deliveryDate = z.iso
  .date()
  .refine((s) => {
    const d = Date.parse(`${s}T00:00:00.000Z`);
    const today = Math.floor(Date.now() / DAY_MS) * DAY_MS;
    return d >= today && d <= today + MAX_DAYS_AHEAD * DAY_MS;
  }, `Date must be between today and ${MAX_DAYS_AHEAD} days ahead`)
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number"));

// Strict on purpose: price, total, status, sellerId... cannot be sent by the client. They are all computed server-side.
export const checkoutSchema = z
  .strictObject({
    recipientName: z.string().trim().min(2).max(80),
    phone,
    deliveryMethod: z.enum(Object.values(DeliveryMethod)),
    address: z.string().trim().min(10).max(300).optional(),
    deliveryDate,
    note: z.string().trim().max(300).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod === DeliveryMethod.DELIVERY && !v.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Address is required for delivery" });
    }
  });

export const orderStatusSchema = z.strictObject({ status: z.enum(Object.values(OrderStatus)) });

const status = z.enum(Object.values(OrderStatus)).optional();

export const myOrdersQuery = z.object({ page: pageField, limit: limitField(20, 100), status });
export const sellerOrdersQuery = z.object({ page: pageField, limit: limitField(20, 100), status });
export const adminOrdersQuery = z.object({
  page: pageField,
  limit: limitField(20, 100),
  status,
  sellerId: z.uuid().optional(),
  customerId: z.uuid().optional(),
  code: z.string().trim().max(20).optional(),
});
