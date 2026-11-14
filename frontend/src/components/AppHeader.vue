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
      <RouterLink to="/" class="brand"><span>Gutarik</span> <em>Kue</em></RouterLink>

      <button type="button" class="menu-btn" :aria-expanded="menuOpen" aria-controls="main-nav" @click="menuOpen = !menuOpen">
        {{ menuOpen ? "Tutup" : "Menu" }}
      </button>

      <nav id="main-nav" aria-label="Navigasi utama" :class="{ open: menuOpen }">
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

        <template v-if="auth.user">
          <span class="who">
            {{ auth.user.name }}
            <span class="badge" :data-role="auth.user.role">{{ ROLE_LABEL[auth.user.role] }}</span>
          </span>
          <button type="button" class="link-btn" @click="logout">Keluar</button>
        </template>
        <template v-else>
          <RouterLink to="/login">Masuk</RouterLink>
          <RouterLink to="/register" class="btn small">Daftar</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.top { background: var(--bg); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 20; }
.bar { max-width: 1100px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.brand { font-family: var(--serif); font-size: 1.5rem; text-decoration: none; color: var(--ink); }
.brand em { color: var(--gold); }
nav { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
nav a { text-decoration: none; font-weight: 600; color: var(--ink); padding: 4px 0; border-bottom: 2px solid transparent; }
nav a:hover { border-bottom-color: var(--line); }
nav a.active { border-bottom-color: var(--gold); }
nav a.btn { color: var(--accent-ink); border-bottom: 1.5px solid var(--accent); }
.count { display: inline-block; min-width: 20px; padding: 0 6px; margin-left: 2px; border-radius: 99px; background: var(--accent); color: #fff; font-size: 0.75rem; text-align: center; }
.who { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.badge { font-size: 0.75rem; padding: 2px 10px; border-radius: 99px; background: var(--line); color: var(--ink); }
.badge[data-role="ADMIN"] { background: #4a2c3a; color: #fff; }
.badge[data-role="SELLER"] { background: var(--gold); color: #2a1a10; }
.menu-btn { display: none; background: none; border: 1.5px solid var(--line); border-radius: 99px; padding: 6px 16px; font: 600 0.9rem var(--sans); color: var(--ink); cursor: pointer; }
@media (max-width: 820px) {
  .menu-btn { display: inline-block; }
  nav { display: none; width: 100%; flex-direction: column; align-items: flex-start; gap: 12px; padding: 8px 0 4px; }
  nav.open { display: flex; }
}
</style>
