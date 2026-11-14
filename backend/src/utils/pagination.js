import { z } from "zod";

export const pageField = z.coerce.number().int().min(1).max(100000).default(1);
export const limitField = (def, max) => z.coerce.number().int().min(1).max(max).default(def);

export const pageArgs = (page, limit) => ({ skip: (page - 1) * limit, take: limit });
export const pageMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
