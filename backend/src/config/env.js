import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, "use a number + s/m/h/d, e.g. 15m").default("15m"),
  CORS_ORIGIN: z.url().default("http://localhost:5173"),
  LOG_DIR: z.string().default("./logs"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  // Number of reverse-proxy hops in front of the API (Vite proxy in dev, nginx in prod).
  // Requests per minute per IP for the whole API (login/register/checkout have their own, stricter limits).
  API_RATE_LIMIT_PER_MIN: z.coerce.number().int().min(10).max(1_000_000).default(120),
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Print variable names and reasons only. Never print values.
  for (const issue of parsed.error.issues) {
    console.error(`Invalid environment: ${issue.path.join(".")} ${issue.message}`);
  }
  process.exit(1);
}

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 };
const [, amount, unit] = /^(\d+)([smhd])$/.exec(parsed.data.JWT_EXPIRES_IN);

export const env = Object.freeze({
  ...parsed.data,
  JWT_EXPIRES_SECONDS: Number(amount) * UNIT_SECONDS[unit],
  isProd: parsed.data.NODE_ENV === "production",
});
