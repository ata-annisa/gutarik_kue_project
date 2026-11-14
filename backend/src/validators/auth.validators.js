import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

// bcrypt silently ignores everything after 72 bytes, so refuse longer passwords
// instead of pretending to check them.
const newPassword = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .refine((p) => Buffer.byteLength(p, "utf8") <= 72, "Password must be at most 72 bytes")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a digit");

export const registerSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  email,
  password: newPassword,
});

// No password policy on login: only registration enforces it.
export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1).max(200),
});
