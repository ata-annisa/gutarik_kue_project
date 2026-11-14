# Gutarik Kue: backend

Express 5 + Prisma 7 + PostgreSQL. Roles: `ADMIN`, `SELLER`, `CUSTOMER`.
Session = JWT in an httpOnly cookie (`gk_session`). Every error body is `{ "error": "...", "details"?: [...] }`.
Every state-changing action is written as one JSON line to `logs/security-audit.log`.

## Install (on top of the existing project)

```bash
# 1. extract this zip over your project (it only touches backend/)
docker compose up -d --build
docker compose exec backend npx prisma migrate dev --name commerce
docker compose exec backend npm run db:constraints     # optional: CHECK constraints (stock >= 0 ...)
docker compose exec backend npm run seed               # admin + seller + the 10 products of the original demo
```

`.env` needs `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_SELLER_EMAIL`, `SEED_SELLER_PASSWORD`
(10-72 bytes, a letter and a digit). Remove them after seeding. `SEED_DEMO_PRODUCTS=false` skips the demo catalog.

**Schema changes vs. the previous version** (what `migrate dev` will generate): new `Cart`, `CartItem`;
`Product` gets `status`/`rejectionReason`/`reviewedById`/`reviewedAt`; `Order` gets a required `sellerId`;
`OrderItem` loses `sellerId`; `OrderStatus` becomes `PENDING | PROCESSING | SHIPPED | DELIVERED`.
These tables had no endpoints before, so they are empty and the migration applies cleanly. If Prisma refuses because
you inserted rows by hand, `npx prisma migrate reset` (development only, wipes data) and seed again.

## How a purchase works

1. A **seller** creates a product -> `PENDING`. An **admin** approves it -> it appears in the public catalog.
2. A **customer** adds products to the cart, then checks out. Prices and totals are computed on the server;
   the request cannot carry a price. One order is created **per seller** in the cart.
3. Each **seller** moves their own orders `PENDING -> PROCESSING -> SHIPPED -> DELIVERED` (one step at a time).
4. **Admins** can look at every order and at system-wide statistics.

## Endpoints (all under `/api`)

Lists are paginated: `?page=1&limit=20` and answer `{ <items>, meta: { page, limit, total, totalPages } }`.

### Public
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }`, always creates a CUSTOMER |
| POST | `/auth/login` | `{ email, password }`, sets the session cookie |
| POST | `/auth/logout`, GET `/auth/me` | authenticated |
| GET | `/products` | `?q=&category=&sort=newest\|price_asc\|price_desc\|name&limit<=50`. Approved + listed products only |
| GET | `/products/categories` | distinct categories in the catalog |
| GET | `/products/:id` | 404 unless approved and listed |

### Customer (`CUSTOMER` only)
| Method | Path | Notes |
|---|---|---|
| GET | `/cart` | items with server-side `unitPrice`, `lineTotal`, `issue` (`UNAVAILABLE`/`INSUFFICIENT_STOCK`/null), `subtotal`, `canCheckout` |
| POST | `/cart/items` | `{ productId, quantity 1..50 }`; adding the same product again adds to its quantity |
| PATCH | `/cart/items/:id` | `{ quantity }` |
| DELETE | `/cart/items/:id` | |
| POST | `/orders/checkout` | `{ recipientName, phone, deliveryMethod: PICKUP\|DELIVERY, address? (required for DELIVERY), deliveryDate: "YYYY-MM-DD" (today..+90d), note? }` -> `{ orders[], grandTotal }` |
| GET | `/orders`, `/orders/:id` | the caller's own orders (`?status=`) |

### Seller (`SELLER` only)
| Method | Path | Notes |
|---|---|---|
| GET / POST | `/seller/products` | POST body: `{ name, category, price, description?, imageUrl?, discountPct?, stock? }`. New products start `PENDING` |
| GET / PATCH / DELETE | `/seller/products/:id` | own products only. Changing name/category/description/imageUrl of an approved product sends it back to `PENDING` (`resubmitted: true`). Price, stock, discount and `isActive` can change freely. A product with order history cannot be deleted (hide it with `isActive: false`) |
| GET | `/seller/orders`, `/seller/orders/:id` | orders for the seller's own products (`?status=`) |
| PATCH | `/seller/orders/:id/status` | `{ status }`: the next state only. Repeating the same status is a harmless no-op |
| GET | `/seller/stats` | own products by status, low/out of stock, orders by status, revenue (DELIVERED), pipeline, top products, last 7 days |

### Admin (`ADMIN` only)
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | |
| PATCH | `/admin/users/:id/role`, `/admin/users/:id/status` | revokes the user's sessions; cannot change yourself or remove the last active admin |
| GET | `/admin/products` | moderation queue (`?status=PENDING\|APPROVED\|REJECTED&q=`) |
| POST | `/admin/products/:id/approve`, `/admin/products/:id/reject` | reject needs `{ reason }`; it also takes down an approved product |
| GET | `/admin/orders`, `/admin/orders/:id` | all orders (`?status=&sellerId=&customerId=&code=`), read only |
| GET | `/admin/stats` | users by role, products by status, orders by status, revenue, pipeline, last 7 days |

`revenue` = sum of `DELIVERED` orders. `pipeline` = value of orders still being fulfilled. Daily buckets use WIB (UTC+7).

## Security and integrity notes

- **RBAC + ownership.** Role checks are default-deny (`authorize`), and id-based routes verify ownership. Someone else's
  record answers with the same 404 as a missing one (no id probing) and the attempt is logged as `RBAC_DENIED / NOT_OWNER`.
- **Mass assignment.** Every body schema is strict: `status`, `sellerId`, `price` on checkout, `totalAmount`... are rejected with 400.
- **No overselling.** Stock is taken with one conditional `UPDATE ... WHERE stock >= qty`; cart rows are claimed by deleting
  them, so a double click cannot create two orders. Any failure rolls the whole checkout back.
- **Moderation cannot be bypassed.** Content edits of an approved product re-enter the queue.
- **Rate limits.** API 120/min per IP (`API_RATE_LIMIT_PER_MIN`), login, register, and checkout (10 per 10 minutes per account).

## Not included (on purpose)

- **Order cancellation / refunds.** The four statuses requested have no "cancelled", and cancelling must put stock back.
  Say the word and it is one more status, one transition and a stock restore inside a transaction.
- **Product variants** ("1 cup" vs "box of 4") of the original demo: one price per product for now.
- **Image upload.** `imageUrl` accepts an http(s) URL only.
- **Payments.** Orders start `PENDING` with no payment step.
