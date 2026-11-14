import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { ROLES, guardDecision } from "./guards";

const { ADMIN, SELLER, CUSTOMER } = ROLES;
const page = (name) => () => import(`../views/${name}.vue`);

// meta.requiresAuth / meta.roles  -> navigation guard (UX only, the API enforces the real rules)
// meta.guestOnly                  -> logged-in users are sent to their dashboard
// meta.title                      -> document title
const routes = [
  { path: "/", name: "home", component: page("HomeView"), meta: { title: "Beranda" } },

  // ---- public catalog
  { path: "/shop", name: "shop", component: page("CatalogView"), meta: { title: "Katalog" } },
  { path: "/shop/:id", name: "product", component: page("ProductDetailView"), meta: { title: "Produk" } },

  // ---- authentication
  { path: "/login", name: "login", component: page("Login"), meta: { guestOnly: true, title: "Masuk" } },
  { path: "/register", name: "register", component: page("Register"), meta: { guestOnly: true, title: "Daftar" } },

  // ---- customer
  { path: "/account", name: "account", component: page("CustomerDashboard"), meta: { requiresAuth: true, roles: [CUSTOMER], title: "Akun saya" } },
  { path: "/cart", name: "cart", component: page("CartView"), meta: { requiresAuth: true, roles: [CUSTOMER], title: "Keranjang" } },
  { path: "/checkout", name: "checkout", component: page("CheckoutView"), meta: { requiresAuth: true, roles: [CUSTOMER], title: "Checkout" } },
  { path: "/orders", name: "orders", component: page("OrdersView"), meta: { requiresAuth: true, roles: [CUSTOMER], title: "Pesanan saya" } },

  // ---- seller
  { path: "/seller", name: "seller", component: page("SellerDashboard"), meta: { requiresAuth: true, roles: [SELLER], title: "Dasbor penjual" } },
  { path: "/seller/products", name: "seller-products", component: page("SellerProductsView"), meta: { requiresAuth: true, roles: [SELLER], title: "Produk saya" } },
  { path: "/seller/products/new", name: "seller-product-new", component: page("SellerProductFormView"), meta: { requiresAuth: true, roles: [SELLER], title: "Produk baru" } },
  { path: "/seller/products/:id/edit", name: "seller-product-edit", component: page("SellerProductFormView"), meta: { requiresAuth: true, roles: [SELLER], title: "Ubah produk" } },
  { path: "/seller/orders", name: "seller-orders", component: page("SellerOrdersView"), meta: { requiresAuth: true, roles: [SELLER], title: "Pesanan masuk" } },

  // ---- admin
  { path: "/admin", name: "admin", component: page("AdminDashboard"), meta: { requiresAuth: true, roles: [ADMIN], title: "Dasbor admin" } },
  { path: "/admin/users", name: "admin-users", component: page("UserManagementView"), meta: { requiresAuth: true, roles: [ADMIN], title: "Manajemen pengguna" } },
  { path: "/admin/products", name: "admin-products", component: page("AdminProductsView"), meta: { requiresAuth: true, roles: [ADMIN], title: "Moderasi produk" } },
  { path: "/admin/orders", name: "admin-orders", component: page("AdminOrdersView"), meta: { requiresAuth: true, roles: [ADMIN], title: "Semua pesanan" } },

  { path: "/forbidden", name: "forbidden", component: page("Forbidden"), meta: { title: "Akses ditolak" } },
  { path: "/:pathMatch(.*)*", name: "not-found", component: page("NotFound"), meta: { title: "Tidak ditemukan" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init(); // first navigation waits for GET /api/auth/me, later ones return instantly
  return guardDecision(to.meta, auth.user, to.fullPath);
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | Gutarik Kue` : "Gutarik Kue";
});

export default router;
