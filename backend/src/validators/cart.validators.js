import { z } from "zod";
import { MAX_ITEM_QTY } from "../utils/pricing.js";

const quantity = z.number().int().min(1).max(MAX_ITEM_QTY);

export const addItemSchema = z.strictObject({ productId: z.uuid(), quantity });
export const updateItemSchema = z.strictObject({ quantity });
