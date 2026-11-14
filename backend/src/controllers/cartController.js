// The customer's cart. The cart is always the caller's own (derived from the session, never from a user id in the URL).
import { prisma } from "../config/prisma.js";
import { ActionError, assertOwner, handle, isUniqueViolation, parse } from "../utils/http.js";
import { MAX_CART_ITEMS, MAX_ITEM_QTY } from "../utils/pricing.js";
import { idParams } from "../validators/common.validators.js";
import { addItemSchema, updateItemSchema } from "../validators/cart.validators.js";
import { purchasableWhere } from "../services/productRules.js";
import { getCartView } from "../services/cartService.js";

const cartResponse = async (req) => ({ cart: await getCartView(prisma, req.user.id) });

const stockError = (stock) =>
  new ActionError(409, `Not enough stock (${stock} left)`, { reason: "INSUFFICIENT_STOCK" });

// GET /api/cart
export const getCart = handle(async (req, res) => {
  res.json(await cartResponse(req));
});

// POST /api/cart/items   body: { productId, quantity }   (adding the same product again adds to its quantity)
export const addItem = handle(async (req, res) => {
  const { productId, quantity } = parse(addItemSchema, req.body);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, ...purchasableWhere }, select: { stock: true } });
      if (!product) throw new ActionError(404, "Product not available");

      const cart = await tx.cart.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id }, update: {}, select: { id: true } });
      const key = { cartId_productId: { cartId: cart.id, productId } };
      const existing = await tx.cartItem.findUnique({ where: key, select: { quantity: true } });

      const newQty = (existing?.quantity ?? 0) + quantity;
      if (newQty > MAX_ITEM_QTY) throw new ActionError(409, `At most ${MAX_ITEM_QTY} per product`, { reason: "MAX_QUANTITY" });
      if (newQty > product.stock) throw stockError(product.stock);
      if (!existing && (await tx.cartItem.count({ where: { cartId: cart.id } })) >= MAX_CART_ITEMS) {
        throw new ActionError(409, `A cart holds at most ${MAX_CART_ITEMS} different products`, { reason: "CART_FULL" });
      }

      await tx.cartItem.upsert({ where: key, create: { cartId: cart.id, productId, quantity: newQty }, update: { quantity: newQty } });
      return !existing;
    });
  } catch (err) {
    // Two first-time adds at the very same instant collide on a unique key: ask the client to repeat.
    if (isUniqueViolation(err)) throw new ActionError(409, "Cart was updated at the same time, please retry", { reason: "CONCURRENT_UPDATE" });
    throw err;
  }

  res.status(created ? 201 : 200).json(await cartResponse(req));
});

async function loadOwnedItem(req, id) {
  const item = await prisma.cartItem.findUnique({ where: { id }, select: { id: true, productId: true, cart: { select: { userId: true } } } });
  assertOwner(req, item, item?.cart.userId, "Cart item");
  return item;
}

// PATCH /api/cart/items/:id   body: { quantity }
export const updateItem = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const { quantity } = parse(updateItemSchema, req.body);
  const item = await loadOwnedItem(req, id);

  const product = await prisma.product.findFirst({ where: { id: item.productId, ...purchasableWhere }, select: { stock: true } });
  if (!product) throw new ActionError(409, "This product is no longer available. Remove it from your cart.", { reason: "PRODUCT_UNAVAILABLE" });
  if (quantity > product.stock) throw stockError(product.stock);

  await prisma.cartItem.update({ where: { id }, data: { quantity } });
  res.json(await cartResponse(req));
});

// DELETE /api/cart/items/:id
export const removeItem = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  await loadOwnedItem(req, id);
  await prisma.cartItem.delete({ where: { id } });
  res.json(await cartResponse(req));
});
