// Creates .env from .env.example with freshly generated secrets.
// Usage (from repo root): node scripts/init-env.mjs
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".env")) {
  console.log(".env already exists, leaving it alone.");
  process.exit(0);
}
const hex = (n) => randomBytes(n).toString("hex");
const out = readFileSync(".env.example", "utf8")
  .replace("POSTGRES_PASSWORD=REPLACE_ME", `POSTGRES_PASSWORD=${hex(24)}`)
  .replace("JWT_SECRET=REPLACE_ME", `JWT_SECRET=${hex(48)}`);
writeFileSync(".env", out, { mode: 0o600 });
console.log(".env created with generated secrets.");
