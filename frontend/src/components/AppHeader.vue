<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { useToastStore } from "../stores/toast";
import { ROLE_LABEL } from "../utils/validation";

const auth = useAuthStore();
const cart = useCartStore();
const toast = useToastStore();
const router = useRouter();
const route = useRoute();
const menuOpen = ref(false);

// The navigation changes with the role. (It only hides links; the API enforces the real permissions.)
const links = computed(() => {
  switch (auth.user?.role) {
    case "CUSTOMER":
      return [
        { to: "/shop", label: "Katalog" },
        { to: "/cart", label: "Keranjang", badge: cart.itemCount },
        { to: "/orders", label: "Pesanan" },
        { to: "/account", label: "Akun" },
      ];
    case "SELLER":
      return [
        { to: "/seller", label: "Dasbor", exact: true },
        { to: "/seller/products", label: "Produk" },
        { to: "/seller/orders", label: "Pesanan masuk" },
        { to: "/shop", label: "Katalog" },
      ];
    case "ADMIN":
      return [
        { to: "/admin", label: "Dasbor", exact: true },
        { to: "/admin/users", label: "Pengguna" },
        { to: "/admin/products", label: "Moderasi" },
        { to: "/admin/orders", label: "Pesanan" },
        { to: "/shop", label: "Katalog" },
      ];
    default:
      return [{ to: "/shop", label: "Katalog" }];
  }
});

const isActive = (l) => (l.exact ? route.path === l.to : route.path === l.to || route.path.startsWith(`${l.to}/`));

// The cart badge only exists for customers: load it when one signs in, drop it otherwise.
watch(
  () => auth.user?.id,
  () => {
    if (auth.user?.role === "CUSTOMER") cart.load().catch(() => {});
    else cart.reset();
  },
  { immediate: true }
);
watch(() => route.fullPath, () => (menuOpen.value = false));

async function logout() {
  try {
    await auth.logout();
  } finally {
    cart.reset();
    toast.info("Anda sudah keluar.");
    router.push({ name: "login" });
  }
}
</script>

<template>
  <header class="top">
    <div class="bar">
      <RouterLink to="/" class="brand" aria-label="Gutarik Kue, ke beranda"><span class="b1">Gutarik</span><span class="b2">Kue</span></RouterLink>

      <button type="button" class="menu-btn" :aria-expanded="menuOpen" aria-controls="main-nav" @click="menuOpen = !menuOpen">
        {{ menuOpen ? "Tutup" : "Menu" }}
      </button>

      <nav id="main-nav" aria-label="Navigasi utama" :class="{ open: menuOpen }">
        <div class="links">
          <RouterLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :class="{ active: isActive(l) }"
            :aria-current="isActive(l) ? 'page' : undefined"
          >
            {{ l.label }}
            <span v-if="l.badge" class="count" :aria-label="`${l.badge} item`">{{ l.badge }}</span>
          </RouterLink>
        </div>

        <div class="account">
          <template v-if="auth.user">
            <span class="who">
              {{ auth.user.name }}
              <span class="badge" :data-role="auth.user.role">{{ ROLE_LABEL[auth.user.role] }}</span>
            </span>
            <button type="button" class="link-btn logout" @click="logout">Keluar</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="plain">Masuk</RouterLink>
            <RouterLink to="/register" class="pill">Daftar</RouterLink>
          </template>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.top { position: sticky; top: 0; z-index: 20; background: linear-gradient(rgba(247, 197, 194, 0.97), rgba(247, 197, 194, 0.9)); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.bar { max-width: 1120px; margin: 0 auto; padding: 18px 24px 16px; display: flex; align-items: center; gap: 36px; }

/* logo: two stacked words, like the reference */
.brand { display: flex; flex-direction: column; line-height: 1; text-decoration: none; color: var(--slate); font-family: var(--font-brand); text-transform: uppercase; flex: none; }
.b1 { font-weight: 600; font-size: 0.9rem; letter-spacing: 0.2em; }
.b2 { font-weight: 800; font-size: 1.85rem; letter-spacing: 0.08em; margin-top: 3px; }

/* editorial menu bar: a thin slate line above and below */
nav { flex: 1; min-width: 0; display: flex; align-items: center; gap: 28px; border-top: 1px solid var(--slate); border-bottom: 1px solid var(--slate); padding: 13px 4px; }
.links { display: flex; align-items: center; gap: 34px; flex-wrap: wrap; }
.links a { position: relative; text-decoration: none; font: 600 0.72rem var(--font-body); letter-spacing: 0.17em; text-transform: uppercase; color: var(--slate); padding: 5px 0; transition: color 0.15s ease; }
.links a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; border-radius: 2px; background: var(--coral); transform: scaleX(0); transform-origin: left; transition: transform 0.22s ease; }
.links a:hover::after, .links a.active::after { transform: scaleX(1); }
.count { display: inline-block; min-width: 19px; padding: 1px 6px; margin-left: 4px; border-radius: var(--pill); background: var(--coral); color: #fff; font: 600 0.68rem var(--font-body); letter-spacing: 0; text-align: center; vertical-align: 1px; }

.account { margin-left: auto; display: flex; align-items: center; gap: 18px; flex: none; }
.plain { text-decoration: none; font: 600 0.72rem var(--font-body); letter-spacing: 0.17em; text-transform: uppercase; color: var(--slate); }
.plain:hover { color: var(--coral-dark); }
.pill { text-decoration: none; background: var(--slate); color: #fff; border-radius: var(--pill); padding: 8px 24px; font: 600 0.72rem var(--font-body); letter-spacing: 0.17em; text-transform: uppercase; transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease; }
.pill:hover { background: #434f78; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(79, 93, 136, 0.3); }
.who { display: inline-flex; align-items: center; gap: 10px; font: 600 0.82rem var(--font-body); color: var(--slate); }
.badge { font: 600 0.66rem var(--font-body); letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 12px; border-radius: var(--pill); background: #fff; color: var(--slate); }
.badge[data-role="ADMIN"] { background: var(--slate); color: #fff; }
.badge[data-role="SELLER"] { background: var(--coral); color: #fff; }
.logout { font: 600 0.72rem var(--font-body); letter-spacing: 0.17em; text-transform: uppercase; text-decoration: none; color: var(--slate); }
.logout:hover { color: var(--coral-dark); }

.menu-btn { display: none; margin-left: auto; background: var(--slate); color: #fff; border: 0; border-radius: var(--pill); padding: 8px 22px; font: 600 0.72rem var(--font-body); letter-spacing: 0.17em; text-transform: uppercase; cursor: pointer; }
@media (max-width: 920px) {
  .bar { flex-wrap: wrap; gap: 14px; }
  .menu-btn { display: inline-block; }
  nav { display: none; width: 100%; flex: 1 1 100%; flex-direction: column; align-items: flex-start; gap: 18px; padding: 18px 4px; }
  nav.open { display: flex; }
  .links { flex-direction: column; align-items: flex-start; gap: 16px; }
  .account { margin-left: 0; flex-wrap: wrap; }
}
</style>
