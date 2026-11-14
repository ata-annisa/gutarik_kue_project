import { ProductStatus, Role } from "../generated/prisma/enums.ts";
import { finalPrice } from "../utils/pricing.js";

const itemSelect = {
  id: true,
  quantity: true,
  productId: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      price: true,
      discountPct: true,
      stock: true,
      status: true,
      isActive: true,
      seller: { select: { id: true, name: true, isActive: true, role: true } },
    },
  },
};

function toCartItem(i) {
  const p = i.product;
  const available =
    p.status === ProductStatus.APPROVED && p.isActive && p.seller.isActive && p.seller.role === Role.SELLER;
  const issue = !available ? "UNAVAILABLE" : p.stock < i.quantity ? "INSUFFICIENT_STOCK" : null;
  const unitPrice = finalPrice(p.price, p.discountPct);
  return {
    id: i.id,
    productId: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    seller: { id: p.seller.id, name: p.seller.name },
    quantity: i.quantity,
    price: p.price,
    discountPct: p.discountPct,
    unitPrice,
    lineTotal: unitPrice * i.quantity,
    stock: p.stock,
    issue, // null | "UNAVAILABLE" | "INSUFFICIENT_STOCK"
  };
}

/** The customer's cart with prices computed from the CURRENT product rows (the client never supplies a price). */
export async function getCartView(db, userId) {
  const cart = await db.cart.findUnique({
    where: { userId },
    select: { items: { select: itemSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
  });
  const items = (cart?.items ?? []).map(toCartItem);
  const ok = items.filter((i) => !i.issue);
  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: ok.reduce((n, i) => n + i.lineTotal, 0), // only items that can actually be bought
    canCheckout: items.length > 0 && ok.length === items.length,
  };
}
