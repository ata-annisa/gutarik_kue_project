// Creates the first ADMIN and SELLER, and a demo catalog taken from the original single-file demo.
// Public registration can only ever create CUSTOMER, so privileged accounts must come from here
// (or from an admin, via PATCH /api/admin/users/:id/role).
// Usage: docker compose exec backend npm run seed
import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma.js";
import { env } from "../src/config/env.js";
import { ProductStatus, Role } from "../src/generated/prisma/enums.ts";

const accounts = [
  { name: "Administrator", role: Role.ADMIN, email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
  { name: "Gutarik Kue", role: Role.SELLER, email: process.env.SEED_SELLER_EMAIL, password: process.env.SEED_SELLER_PASSWORD },
];

// The catalog of the original demo (variants were dropped; one price per product).
const DEMO_PRODUCTS = [
  {"slug": "choco-velvet", "name": "Choco Velvet Cake", "category": "Cake", "price": 185000, "discountPct": 0, "stock": 8, "description": "Cake cokelat lembap dengan ganache dark chocolate."},
  {"slug": "strawberry-cloud", "name": "Strawberry Cloud Cake", "category": "Cake", "price": 175000, "discountPct": 10, "stock": 6, "description": "Sponge vanila ringan, krim segar, dan stroberi."},
  {"slug": "basque-cheesecake", "name": "Basque Burnt Cheesecake", "category": "Cake", "price": 165000, "discountPct": 0, "stock": 10, "description": "Bagian atas gosong karamel, tengah creamy."},
  {"slug": "salted-caramel-cookies", "name": "Salted Caramel Cookies", "category": "Cookies", "price": 78000, "discountPct": 0, "stock": 30, "description": "Renyah di tepi, chewy di tengah, taburan garam laut."},
  {"slug": "double-choco-chunk", "name": "Double Choco Chunk Cookies", "category": "Cookies", "price": 85000, "discountPct": 15, "stock": 24, "description": "Adonan cokelat dengan potongan chocolate chunk besar."},
  {"slug": "fudgy-brownies", "name": "Fudgy Brownies Box", "category": "Brownies", "price": 95000, "discountPct": 0, "stock": 20, "description": "Padat, lengket, dan pekat cokelat."},
  {"slug": "pistachio-eclair", "name": "Pistachio Éclair", "category": "Pastry", "price": 68000, "discountPct": 0, "stock": 15, "description": "Choux renyah, krim pistachio, glasur hijau lembut."},
  {"slug": "butter-croissant", "name": "Butter Croissant", "category": "Pastry", "price": 48000, "discountPct": 0, "stock": 18, "description": "Berlapis, harum mentega, renyah saat digigit."},
  {"slug": "tiramisu-cup", "name": "Tiramisu Cup", "category": "Dessert", "price": 45000, "discountPct": 0, "stock": 25, "description": "Mascarpone lembut, kopi, dan taburan kakao."},
  {"slug": "panna-cotta-mangga", "name": "Panna Cotta Mangga", "category": "Dessert", "price": 42000, "discountPct": 10, "stock": 0, "description": "Panna cotta vanila dengan saus mangga segar."}
];

const users = {};
for (const a of accounts) {
  if (!a.email || !a.password) {
    console.log(`skip ${a.role}: SEED_${a.role}_EMAIL / SEED_${a.role}_PASSWORD not set`);
    continue;
  }
  if (a.password.length < 10 || Buffer.byteLength(a.password) > 72) {
    throw new Error(`${a.role} seed password must be 10-72 bytes`);
  }
  const email = a.email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    console.log(`keep ${a.role}: ${email} already exists (password untouched)`);
  } else {
    const passwordHash = await bcrypt.hash(a.password, env.BCRYPT_ROUNDS);
    user = await prisma.user.create({ data: { name: a.name, email, passwordHash, role: a.role } });
    console.log(`created ${a.role}: ${email}`);
  }
  users[a.role] = user;
}

// Demo products are owned by the seed seller and arrive already APPROVED (reviewed by the seed admin).
if (users[Role.SELLER] && users[Role.ADMIN] && process.env.SEED_DEMO_PRODUCTS !== "false") {
  let created = 0;
  for (const p of DEMO_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        ...p,
        sellerId: users[Role.SELLER].id,
        status: ProductStatus.APPROVED,
        reviewedById: users[Role.ADMIN].id,
        reviewedAt: new Date(),
      },
    });
    created++;
  }
  console.log(`demo products: ${created} created, ${DEMO_PRODUCTS.length - created} already present`);
}

await prisma.$disconnect();
