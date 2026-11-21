<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { catalogApi } from "../api/catalog";
import { errorInfo } from "../api/http";
import { useAddToCart } from "../composables/useAddToCart";
import { rupiah } from "../utils/format";

const route = useRoute();
const { busyId, addToCart } = useAddToCart();

const product = ref(null);
const loading = ref(true);
const error = ref("");
const notFound = ref(false);
const quantity = ref(1);
const imageFailed = ref(false);

const MAX_QTY = 50;
const maxQty = computed(() => Math.min(product.value?.stock ?? 0, MAX_QTY));

async function load() {
  loading.value = true;
  error.value = "";
  notFound.value = false;
  try {
    product.value = await catalogApi.getProduct(route.params.id);
    quantity.value = 1;
    imageFailed.value = false;
  } catch (err) {
    if ([400, 404].includes(err.response?.status)) notFound.value = true;
    else error.value = errorInfo(err).message;
  } finally {
    loading.value = false;
  }
}
watch(() => route.params.id, load, { immediate: true });

const step = (delta) => (quantity.value = Math.min(Math.max(quantity.value + delta, 1), Math.max(maxQty.value, 1)));
</script>

<template>
  <section class="wrap">
    <RouterLink to="/shop" class="back">&larr; Kembali ke katalog</RouterLink>

    <p v-if="loading" class="state muted">Memuat...</p>
    <div v-else-if="notFound" class="auth-card center">
      <h1>Produk tidak ditemukan</h1>
      <p class="muted">Produk ini tidak ada atau sudah tidak dijual.</p>
      <RouterLink class="btn" to="/shop">Ke katalog</RouterLink>
    </div>
    <div v-else-if="error" class="alert" role="alert">{{ error }}</div>

    <article v-else-if="product" class="detail">
      <div class="pic">
        <img v-if="product.imageUrl && !imageFailed" :src="product.imageUrl" :alt="product.name" referrerpolicy="no-referrer" @error="imageFailed = true" />
        <span v-else class="ph" aria-hidden="true">{{ product.name.charAt(0) }}</span>
      </div>
      <div class="info">
        <p class="eyebrow">{{ product.category }}</p>
        <h1>{{ product.name }}</h1>
        <p class="price">
          <strong>{{ rupiah(product.finalPrice) }}</strong>
          <s v-if="product.discountPct" class="muted">{{ rupiah(product.price) }}</s>
          <span v-if="product.discountPct" class="disc">Hemat {{ product.discountPct }}%</span>
        </p>
        <p class="desc">{{ product.description || "Belum ada deskripsi." }}</p>
        <p class="muted">Dijual oleh {{ product.seller.name }}</p>
        <p class="stock" :class="{ out: product.stock <= 0 }">
          {{ product.stock <= 0 ? "Stok habis" : `Stok tersedia: ${product.stock}` }}
        </p>

        <div v-if="product.stock > 0" class="buy">
          <div class="qty" role="group" aria-label="Jumlah">
            <button type="button" aria-label="Kurangi" :disabled="quantity <= 1" @click="step(-1)">&minus;</button>
            <span class="n" aria-live="polite">{{ quantity }}</span>
            <button type="button" aria-label="Tambah" :disabled="quantity >= maxQty" @click="step(1)">+</button>
          </div>
          <button type="button" class="btn add" :disabled="busyId === product.id" @click="addToCart(product, quantity)">
            {{ busyId === product.id ? "Menambahkan..." : "Tambah ke keranjang" }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.detail { display: grid; gap: 34px; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); align-items: start; }
.pic { aspect-ratio: 4 / 3; background: linear-gradient(140deg, #fce3e0, #f9d2ce); border-radius: 34px; overflow: hidden; border: 1px solid var(--line); box-shadow: var(--shadow); }
.pic img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph { display: grid; place-items: center; width: 100%; height: 100%; font: 400 6rem var(--font-display); color: var(--slate); opacity: 0.78; }
.price { display: flex; gap: 14px; align-items: baseline; flex-wrap: wrap; margin: 6px 0 16px; }
.price strong { font: 700 1.8rem var(--font-brand); color: var(--slate); }
.disc { font: 600 0.78rem var(--font-body); color: #fff; background: var(--coral); padding: 3px 14px; border-radius: var(--pill); }
.desc { white-space: pre-line; color: var(--text-2); }
.stock { color: var(--ok); font-weight: 600; }
.stock.out { color: var(--danger); }
.buy { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
.qty { display: inline-flex; align-items: center; border: 1.5px solid rgba(79, 93, 136, 0.3); border-radius: var(--pill); background: #fff; }
.qty button { width: 42px; height: 42px; border: 0; background: none; font-size: 1.25rem; cursor: pointer; color: var(--slate); border-radius: 50%; transition: background-color 0.15s ease; }
.qty button:hover:not(:disabled) { background: var(--peach); }
.qty button:disabled { opacity: 0.35; cursor: not-allowed; }
.n { min-width: 34px; text-align: center; font-weight: 600; color: var(--slate); }
</style>
