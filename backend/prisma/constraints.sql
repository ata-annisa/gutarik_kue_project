-- Optional hardening: CHECK constraints Prisma cannot express in schema.prisma.
-- They are a last line of defense; the API already enforces the same rules.
-- Idempotent. Run after `prisma migrate dev`:   npm run db:constraints

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_price_positive";
ALTER TABLE "products" ADD CONSTRAINT "products_price_positive" CHECK ("price" > 0);

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_stock_nonneg";
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonneg" CHECK ("stock" >= 0);

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_discount_range";
ALTER TABLE "products" ADD CONSTRAINT "products_discount_range" CHECK ("discountPct" BETWEEN 0 AND 90);

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_quantity_range";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_range" CHECK ("quantity" BETWEEN 1 AND 50);

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_quantity_positive";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_price_nonneg";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_nonneg" CHECK ("unitPrice" >= 0);

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_total_nonneg";
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_nonneg" CHECK ("totalAmount" >= 0);
