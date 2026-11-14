import { z } from "zod";

export const idParams = z.strictObject({ id: z.uuid() });
