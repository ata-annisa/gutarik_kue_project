<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import ProductCard from "../components/ProductCard.vue";
import StateBlock from "../components/StateBlock.vue";
import HeroIllustration from "../components/HeroIllustration.vue";
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
    <div class="copy">
      <p class="eyebrow">Kue buatan tangan</p>
      <h1>Kue segar untuk setiap momen manis.</h1>
      <p class="lead">Pilih kue favorit Anda, pesan untuk tanggal yang Anda mau, dan kami siapkan dengan segar.</p>
      <p class="row cta">
        <RouterLink class="btn" to="/shop">Lihat katalog</RouterLink>
        <RouterLink v-if="auth.user" class="btn slate" :to="homeFor(auth.user.role)">Buka dasbor saya</RouterLink>
        <template v-else>
          <RouterLink class="btn slate" to="/login">Masuk</RouterLink>
          <RouterLink class="btn ghost" to="/register">Daftar</RouterLink>
        </template>
      </p>
    </div>
    <div class="art"><HeroIllustration /></div>
  </section>

  <section class="wrap section latest">
    <div class="page-head">
      <div>
        <p class="eyebrow">Pilihan kami</p>
        <h2 class="section-title">Kue terbaru</h2>
      </div>
      <RouterLink to="/shop" class="more">Lihat semua &rarr;</RouterLink>
    </div>
    <StateBlock :loading="loading" :error="error" :empty="featured.length === 0" empty-text="Belum ada produk di katalog." @retry="load">
      <div class="grid-cards">
        <ProductCard v-for="p in featured" :key="p.id" :product="p" :busy="busyId === p.id" @add="addToCart" />
      </div>
    </StateBlock>
  </section>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 28px 40px; align-items: center; padding-top: 22px; padding-bottom: 6px; }
.copy h1 { font-size: clamp(2.3rem, 5vw, 3.8rem); max-width: 520px; margin-bottom: 18px; }
.lead { max-width: 440px; font-size: 1rem; color: var(--text-2); margin-bottom: 28px; }
.cta { gap: 14px; }
.art { min-width: 0; }
.more { font: 600 0.74rem var(--font-body); letter-spacing: 0.16em; text-transform: uppercase; text-decoration: none; color: var(--slate); }
.more:hover { color: var(--coral-dark); }
.latest .page-head { align-items: flex-end; }
@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; }
  .art { order: -1; max-width: 460px; margin: 0 auto; }
}
</style>
