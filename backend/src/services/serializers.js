import { finalPrice } from "../utils/pricing.js";

// ---------- products ----------
// Public shape: nothing about moderation, ownership internals or visibility flags.
export const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  description: true,
  imageUrl: true,
  price: true,
  discountPct: true,
  stock: true,
  createdAt: true,
  seller: { select: { id: true, name: true } },
};

export const toPublicProduct = (p) => ({ ...p, finalPrice: finalPrice(p.price, p.discountPct) });

// Seller / admin shape: everything about the product, including its moderation state.
export const managedProductSelect = {
  id: true,
  sellerId: true,
  name: true,
  slug: true,
  category: true,
  description: true,
  imageUrl: true,
  price: true,
  discountPct: true,
  stock: true,
  isActive: true,
  status: true,
  rejectionReason: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
};

export const toManagedProduct = (p) => ({ ...p, finalPrice: finalPrice(p.price, p.discountPct) });

// ---------- orders ----------
const orderItemSelect = { id: true, productId: true, productName: true, unitPrice: true, quantity: true };

// Customers and sellers only ever see names of the other party. Admins also get the email.
export const orderInclude = (forAdmin = false) => ({
  items: { select: orderItemSelect, orderBy: { id: "asc" } },
  customer: { select: { id: true, name: true, ...(forAdmin && { email: true }) } },
  seller: { select: { id: true, name: true, ...(forAdmin && { email: true }) } },
});

export const toOrder = (o) => ({
  id: o.id,
  code: o.code,
  status: o.status,
  deliveryMethod: o.deliveryMethod,
  recipientName: o.recipientName,
  phone: o.phone,
  address: o.address,
  deliveryDate: o.deliveryDate.toISOString().slice(0, 10),
  note: o.note,
  totalAmount: o.totalAmount,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  customer: o.customer,
  seller: o.seller,
  items: o.items.map((i) => ({ ...i, lineTotal: i.unitPrice * i.quantity })),
});
