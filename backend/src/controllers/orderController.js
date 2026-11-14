// Customer side of orders: checkout and "my orders".
import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { assertOwner, handle, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { idParams } from "../validators/common.validators.js";
import { checkoutSchema, myOrdersQuery } from "../validators/order.validators.js";
import { checkout } from "../services/checkoutService.js";
import { orderInclude, toOrder } from "../services/serializers.js";

// POST /api/orders/checkout   (one order is created per seller in the cart)
export const checkoutCart = handle(async (req, res) => {
  const input = parse(checkoutSchema, req.body);
  const orders = await checkout(req.user.id, input);

  for (const o of orders) {
    audit("ORDER_CREATED", req, {
      orderId: o.id,
      orderCode: o.code,
      sellerId: o.sellerId,
      totalAmount: o.totalAmount,
      itemCount: o.items.length,
    });
  }
  res.status(201).json({ orders: orders.map(toOrder), grandTotal: orders.reduce((n, o) => n + o.totalAmount, 0) });
});

// GET /api/orders?page=&limit=&status=
export const listMyOrders = handle(async (req, res) => {
  const { page, limit, status } = parse(myOrdersQuery, req.query);
  const where = { customerId: req.user.id, ...(status && { status }) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude(false), orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageArgs(page, limit) }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: rows.map(toOrder), meta: pageMeta(page, limit, total) });
});

// GET /api/orders/:id
export const getMyOrder = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude(false) });
  assertOwner(req, order, order?.customerId, "Order");
  res.json({ order: toOrder(order) });
});
