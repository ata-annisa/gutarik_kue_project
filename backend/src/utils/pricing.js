// All money is integer Rupiah. These limits keep every sum inside PostgreSQL's 32-bit INTEGER.
export const MAX_ITEM_QTY = 50;
export const MAX_CART_ITEMS = 30;
export const MAX_ORDER_TOTAL = 2_000_000_000;

/** Price after discount, rounded to whole Rupiah. The ONLY place this formula exists. */
export const finalPrice = (price, discountPct) => Math.round((price * (100 - discountPct)) / 100);
