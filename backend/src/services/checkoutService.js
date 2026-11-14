import { randomInt } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { DeliveryMethod, ProductStatus, Role } from "../generated/prisma/enums.ts";
import { ActionError } from "../utils/http.js";
import { MAX_ORDER_TOTAL, finalPrice } from "../utils/pricing.js";
import { orderInclude } from "./serializers.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const newOrderCode = () =>
  "GK-" + Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");

const conflict = (message, reason) => new ActionError(409, message, { reason });

/**
 * Turn the customer's cart into orders (one per seller), atomically:
 *
 *  1. CLAIM the cart rows by deleting them. A second, simultaneous checkout of the same cart blocks on
 *     those row locks, then finds nothing to delete and fails, so a double click never creates two orders.
 *  2. TAKE the stock with ONE conditional UPDATE per product (stock >= qty, same status/price as the
 *     snapshot). PostgreSQL re-checks the condition after waiting for a row lock, so two buyers racing for the
 *     last cake cannot both get it: stock never goes negative. Products are locked in id order, so
 *     concurrent checkouts cannot deadlock each other.
 *  3. PRICES come from the product rows read inside the transaction, never from the request.
 *
 * Any failure throws and PostgreSQL rolls back everything: cart, stock and orders stay untouched.
 */
async function runCheckout(tx, customerId, input) {
  const cart = await tx.cart.findUnique({
    where: { userId: customerId },
    select: {
      items: {
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discountPct: true,
              status: true,
              isActive: true,
              seller: { select: { id: true, isActive: true, role: true } },
            },
          },
        },
        orderBy: { productId: "asc" },
      },
    },
  });
  if (!cart || cart.items.length === 0) throw conflict("Cart is empty", "CART_EMPTY");

  // Fail early with a clear message if something in the cart is no longer for sale.
  for (const it of cart.items) {
    const p = it.product;
    const sellable =
      p.status === ProductStatus.APPROVED && p.isActive && p.seller.isActive && p.seller.role === Role.SELLER;
    if (!sellable) throw conflict(`"${p.name}" is no longer available. Remove it from your cart.`, "PRODUCT_UNAVAILABLE");
  }

  // 1. claim the cart rows
  for (const it of cart.items) {
    const claimed = await tx.cartItem.deleteMany({ where: { id: it.id, quantity: it.quantity } });
    if (claimed.count !== 1) throw conflict("Your cart changed during checkout. Review it and try again.", "CART_CHANGED");
  }

  // 2 + 3. take stock and snapshot prices
  const bySeller = new Map();
  for (const it of cart.items) {
    const p = it.product;
    const taken = await tx.product.updateMany({
      where: {
        id: p.id,
        status: ProductStatus.APPROVED,
        isActive: true,
        price: p.price,
        discountPct: p.discountPct,
        stock: { gte: it.quantity },
      },
      data: { stock: { decrement: it.quantity } },
    });
    if (taken.count !== 1) {
      throw conflict(`Not enough stock for "${p.name}", or its price just changed. Review your cart.`, "STOCK_OR_PRICE_CHANGED");
    }
    const line = { productId: p.id, productName: p.name, quantity: it.quantity, unitPrice: finalPrice(p.price, p.discountPct) };
    if (!bySeller.has(p.seller.id)) bySeller.set(p.seller.id, []);
    bySeller.get(p.seller.id).push(line);
  }

  // one order per seller
  const orders = [];
  for (const sellerId of [...bySeller.keys()].sort()) {
    const lines = bySeller.get(sellerId);
    const totalAmount = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
    if (totalAmount > MAX_ORDER_TOTAL) throw new ActionError(400, "Order total is too large", { reason: "TOTAL_TOO_LARGE" });

    orders.push(
      await tx.order.create({
        data: {
          code: newOrderCode(),
          customerId,
          sellerId,
          deliveryMethod: input.deliveryMethod,
          recipientName: input.recipientName,
          phone: input.phone,
          address: input.deliveryMethod === DeliveryMethod.DELIVERY ? input.address : null,
          deliveryDate: input.deliveryDate,
          note: input.note ?? null,
          totalAmount,
          items: { create: lines },
        },
        include: orderInclude(false),
      })
    );
  }
  return orders;
}

export async function checkout(customerId, input) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction((tx) => runCheckout(tx, customerId, input), { timeout: 15_000, maxWait: 5_000 });
    } catch (err) {
      // Only an (astronomically unlikely) order code collision lands here: try again with new codes.
      if (err?.code === "P2002" && attempt < 3) continue;
      throw err;
    }
  }
}
