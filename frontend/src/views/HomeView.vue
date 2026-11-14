<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { catalogApi } from "../api/catalog";
import { errorInfo } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useAddToCart } from "../composables/useAddToCart";
import { homeFor } from "../router/guards";

const auth = useAuthStore();
const { busyId, addToCart } = useAddToCart();

const featured = ref([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    featured.value = (await catalogApi.listProducts({ limit: 4, sort: "newest" })).products;
  } catch (err) {
    error.value = errorInfo(err).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<template>
  <section class="wrap hero">
    <p class="eyebrow">Kue buatan tangan</p>
    <h1>Gutarik Kue</h1>
    <p class="muted lead">Pilih kue favorit Anda, pesan untuk tanggal yang Anda mau, dan kami siapkan dengan segar.</p>
    <p class="row">
      <RouterLink class="btn" to="/shop">Lihat katalog</RouterLink>
      <RouterLink v-if="auth.user" class="btn ghost" :to="homeFor(auth.user.role)">Buka dasbor saya</RouterLink>
      <template v-else>
        <RouterLink class="btn ghost" to="/login">Masuk</RouterLink>
        <RouterLink class="btn ghost" to="/register">Daftar</RouterLink>
      </template>
    </p>
  </section>

  <section class="wrap section">
    <div class="page-head">
      <h2>Kue terbaru</h2>
      <RouterLink to="/shop">Lihat semua &rarr;</RouterLink>
    </div>
    <StateBlock :loading="loading" :error="error" :empty="featured.length === 0" empty-text="Belum ada produk di katalog." @retry="load">
      <div class="grid-cards">
        <ProductCard v-for="p in featured" :key="p.id" :product="p" :busy="busyId === p.id" @add="addToCart" />
      </div>
    </StateBlock>
  </section>
</template>

<style scoped>
.hero { padding-top: 24px; }
.lead { max-width: 560px; font-size: 1.1rem; }
</style>
