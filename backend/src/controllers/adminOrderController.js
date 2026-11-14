// Admins can look at every order in the system (read only).
import { prisma } from "../config/prisma.js";
import { ActionError, handle, parse } from "../utils/http.js";
import { pageArgs, pageMeta } from "../utils/pagination.js";
import { idParams } from "../validators/common.validators.js";
import { adminOrdersQuery } from "../validators/order.validators.js";
import { orderInclude, toOrder } from "../services/serializers.js";

// GET /api/admin/orders?status=&sellerId=&customerId=&code=&page=&limit=
export const listAllOrders = handle(async (req, res) => {
  const { page, limit, status, sellerId, customerId, code } = parse(adminOrdersQuery, req.query);
  const where = {
    ...(status && { status }),
    ...(sellerId && { sellerId }),
    ...(customerId && { customerId }),
    ...(code && { code: { contains: code.toUpperCase() } }),
  };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude(true), orderBy: [{ createdAt: "desc" }, { id: "asc" }], ...pageArgs(page, limit) }),
    prisma.order.count({ where }),
  ]);
  res.json({ orders: rows.map(toOrder), meta: pageMeta(page, limit, total) });
});

// GET /api/admin/orders/:id
export const getAnyOrder = handle(async (req, res) => {
  const { id } = parse(idParams, req.params);
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude(true) });
  if (!order) throw new ActionError(404, "Order not found");
  res.json({ order: toOrder(order) });
});
