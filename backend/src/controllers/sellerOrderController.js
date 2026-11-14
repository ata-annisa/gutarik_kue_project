// Seller side of orders: see orders for your own products and move them through fulfilment.
import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { ActionError, assertOwner, handle, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { NEXT_STATUS } from "../utils/orderStatus.js";
import { idParams } from "../validators/common.validators.js";
import { orderStatusSchema, sellerOrdersQuery } from "../validators/order.validators.js";
import { orderInclude, toOrder } from "../services/serializers.js";

// GET /api/seller/orders?page=&limit=&status=
export const listSellerOrders = handle(async (req, res) => {
  const { page, limit, status } = parse(sellerOrdersQuery, req.query);
  const where = { sellerId: req.user.id, ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude(false), orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageArgs(page, limit) }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: rows.map(toOrder), meta: pageMeta(page, limit, total) });
});

// GET /api/seller/orders/:id
export const getSellerOrder = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude(false) });
  assertOwner(req, order, order?.sellerId, "Order");
  res.json({ order: toOrder(order) });
});

// PATCH /api/seller/orders/:id/status   body: { "status": "PROCESSING" | "SHIPPED" | "DELIVERED" }
export const updateOrderStatus = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const { status } = parse(orderStatusSchema, req.body);

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, code: true, sellerId: true, status: true } });
  assertOwner(req, order, order?.sellerId, "Order");

  const respond = async (changed) => {
    const fresh = await prisma.order.findUnique({ where: { id }, include: orderInclude(false) });
    res.json({ order: toOrder(fresh), changed });
  };

  if (order.status === status) return respond(false); // a retry of the same request is harmless
  if (!NEXT_STATUS[order.status].includes(status)) {
    throw new ActionError(409, `An order cannot go from ${order.status} to ${status}`, { reason: "INVALID_TRANSITION" });
  }

  // Compare-and-set: only move the order if it is still in the status we just read.
  const moved = await prisma.order.updateMany({ where: { id, sellerId: req.user.id, status: order.status }, data: { status } });
  if (moved.count === 0) {
    const now = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (now?.status === status) return respond(false); // another request did exactly this a moment ago
    throw new ActionError(409, "The order was updated at the same time, please reload it", { reason: "CONCURRENT_UPDATE" });
  }

  audit("ORDER_STATUS_CHANGED", req, { orderId: id, orderCode: order.code, fromStatus: order.status, toStatus: status });
  return respond(true);
});
