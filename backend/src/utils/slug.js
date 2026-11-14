import { randomBytes } from "node:crypto";

/** "Choco Velvet Cake" -> "choco-velvet-cake-a1b2c3" (random suffix keeps slugs unique). */
export function makeSlug(name) {
  const base =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+/, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "produk";
  return `${base}-${randomBytes(3).toString("hex")}`;
}
