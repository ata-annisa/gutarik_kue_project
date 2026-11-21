# Gutarik Kue: frontend

Vue 3 (`<script setup>`) + Vite + Pinia + Vue Router + Axios. It talks only to the backend in this repo:
in development Vite proxies `/api` to the backend container, so the browser sees one origin.

## Run

```bash
docker compose up -d --build     # from the project root; the app is on http://localhost:5173
```

Use `localhost`, not `127.0.0.1`: the backend only accepts that exact origin (CORS and CSRF guard).
Sign in with the accounts created by `npm run seed` in the backend (admin and seller). Anyone can register as a customer.

## Pages

| Path | Who | What |
|---|---|---|
| `/` | everyone | landing + newest products |
| `/shop`, `/shop/:id` | everyone | catalog (search, category, sort, pages) and product page |
| `/login`, `/register` | guests | register always creates a customer |
| `/account` | CUSTOMER | summary: cart, active orders, latest orders |
| `/cart`, `/checkout`, `/orders` | CUSTOMER | cart, checkout (one order per seller), order history with status tracking |
| `/seller` | SELLER | store statistics, charts, top products |
| `/seller/products`, `/seller/products/new`, `/seller/products/:id/edit` | SELLER | product CRUD, hide/show, moderation status and rejection reasons |
| `/seller/orders` | SELLER | incoming orders, move them forward one step at a time |
| `/admin` | ADMIN | system statistics and shortcuts |
| `/admin/users` | ADMIN | change roles, block / unblock accounts |
| `/admin/products` | ADMIN | moderation queue: approve, reject with a reason, take down |
| `/admin/orders` | ADMIN | audit of every order (filter by status, seller, code) |

## Structure

```
src/
  api/          one small module per area (http.js holds the axios instance, error translation, 401 hook)
  stores/       auth, cart, toast, confirm (Pinia)
  router/       routes + guards (guards.js is pure, easy to test)
  composables/  usePagedList (paginated lists), useAddToCart
  components/   AppHeader (role aware), ToastHost, ConfirmDialog, OrderCard, ProductCard, ProductForm, ...
  views/        one file per page
  utils/        format (Rupiah, dates), labels (status names), validation
  session.js    what happens when the session expires
```

## Design system

All colours, radii and fonts are CSS variables at the top of `src/styles.css` (`--blush`, `--peach`, `--cream`, `--slate`, `--coral`, `--font-display`, ...).
Change them there and the whole app follows.

| Role | Value |
|---|---|
| Page background | blush `#F7C5C2`, with cream/peach waves `#FCE3E0` and coral lines `#E1736B` |
| Logo, headings, menu | slate `#4F5D88` |
| Body text | `#4A4245` (`#3B3538` for strong text) |
| Main buttons | coral `#E26D65`, white text, full pill |
| Sign up / secondary pills | slate `#4F5D88`, white text, full pill |
| Cards and panels | cream `#FFF8F7`, 1px border `#4F5D88` at 20%, rounded corners |

Fonts are **self-hosted** in `public/fonts` (Berkshire Swash for headings, Montserrat for the logo, Poppins for everything else),
so the app makes no request to Google Fonts. All three are SIL Open Font License; the licences are in the same folder.

Decoration lives in three components that carry no data or behaviour: `DecorBackground.vue` (waves, halftone dots, sparkles, hearts behind every page),
`HeroIllustration.vue` (the cupcakes on the home page) and `SiteFooter.vue`.

## Notes

- **No token in JavaScript.** The session is an httpOnly cookie; the browser attaches it. The store keeps only the profile.
- **Route guards are UX only.** They hide screens a role cannot use. The API enforces the real permissions on every call.
- **Prices are never computed or sent by the client.** The cart, the checkout total and the order lines all come from the API.
- **Messages.** Server errors are translated to Indonesian in `api/http.js`. Notifications use the toast store; confirmations use
  `confirm.ask()` / `confirm.prompt()` (a promise-based dialog) instead of `window.confirm`.
- **Images.** A product image is just a URL the seller pastes; the browser loads it from there.
- `src/components/DashboardLayout.vue` from the previous version is no longer used and can be deleted.
