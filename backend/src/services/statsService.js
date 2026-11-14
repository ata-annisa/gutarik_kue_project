import { prisma } from "../config/prisma.js";
import { OrderStatus, ProductStatus, Role } from "../generated/prisma/enums.ts";

const WIB_MS = 7 * 3_600_000; // reports use Western Indonesia Time (UTC+7)
const DAY_MS = 86_400_000;
const LOW_STOCK_AT = 5;

const zeroMap = (values) => Object.fromEntries(Object.values(values).map((v) => [v, 0]));

/** Order counts and money for any order filter. revenue = DELIVERED orders, pipeline = still being fulfilled. */
async function orderTotals(where = {}) {
  const rows = await prisma.order.groupBy({ by: ["status"], where, _count: { _all: true }, _sum: { totalAmount: true } });
  const byStatus = zeroMap(OrderStatus);
  let total = 0;
  let revenue = 0;
  let pipeline = 0;
  for (const r of rows) {
    byStatus[r.status] = r._count._all;
    total += r._count._all;
    const sum = r._sum.totalAmount ?? 0;
    if (r.status === OrderStatus.DELIVERED) revenue += sum;
    else pipeline += sum;
  }
  return { total, byStatus, revenue, pipeline };
}

/** Orders per day for the last `days` days (WIB calendar days, by order date), oldest first. */
async function dailySeries(where = {}, days = 7) {
  const nowWib = new Date(Date.now() + WIB_MS);
  const todayWib = Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate());
  const firstDay = todayWib - (days - 1) * DAY_MS;

  const series = Array.from({ length: days }, (_, i) => ({
    date: new Date(firstDay + i * DAY_MS).toISOString().slice(0, 10),
    orders: 0,
    revenue: 0,
  }));
  const byDate = new Map(series.map((d) => [d.date, d]));

  const rows = await prisma.order.findMany({
    where: { ...where, createdAt: { gte: new Date(firstDay - WIB_MS) } },
    select: { createdAt: true, totalAmount: true, status: true },
    take: 50_000,
  });
  for (const r of rows) {
    const day = byDate.get(new Date(r.createdAt.getTime() + WIB_MS).toISOString().slice(0, 10));
    if (!day) continue;
    day.orders += 1;
    if (r.status === OrderStatus.DELIVERED) day.revenue += r.totalAmount;
  }
  return series;
}

export async function adminStats() {
  const [userRows, productRows, orders, last7Days] = await Promise.all([
    prisma.user.groupBy({ by: ["role", "isActive"], _count: { _all: true } }),
    prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
    orderTotals(),
    dailySeries(),
  ]);

  const byRole = zeroMap(Role);
  let totalUsers = 0;
  let activeUsers = 0;
  for (const r of userRows) {
    byRole[r.role] += r._count._all;
    totalUsers += r._count._all;
    if (r.isActive) activeUsers += r._count._all;
  }
  const productsByStatus = zeroMap(ProductStatus);
  let totalProducts = 0;
  for (const r of productRows) {
    productsByStatus[r.status] = r._count._all;
    totalProducts += r._count._all;
  }

  return {
    users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers, byRole },
    products: { total: totalProducts, byStatus: productsByStatus, awaitingReview: productsByStatus.PENDING },
    orders,
    last7Days,
  };
}

export async function sellerStats(sellerId) {
  const mine = { sellerId };
  const [productRows, lowStock, outOfStock, orders, last7Days, top] = await Promise.all([
    prisma.product.groupBy({ by: ["status"], where: mine, _count: { _all: true } }),
    prisma.product.count({ where: { ...mine, status: ProductStatus.APPROVED, isActive: true, stock: { gt: 0, lte: LOW_STOCK_AT } } }),
    prisma.product.count({ where: { ...mine, status: ProductStatus.APPROVED, isActive: true, stock: 0 } }),
    orderTotals(mine),
    dailySeries(mine),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { sellerId, status: OrderStatus.DELIVERED } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const productsByStatus = zeroMap(ProductStatus);
  let totalProducts = 0;
  for (const r of productRows) {
    productsByStatus[r.status] = r._count._all;
    totalProducts += r._count._all;
  }

  const names = new Map(
    (await prisma.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: { id: true, name: true } })).map((p) => [p.id, p.name])
  );

  return {
    products: { total: totalProducts, byStatus: productsByStatus, lowStock, outOfStock, lowStockThreshold: LOW_STOCK_AT },
    orders,
    topProducts: top.map((t) => ({ productId: t.productId, name: names.get(t.productId) ?? "(deleted)", unitsSold: t._sum.quantity ?? 0 })),
    last7Days,
  };
}
