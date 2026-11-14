<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { rupiah } from "../utils/format";

const props = defineProps({
  product: { type: Object, required: true }, // public product shape from GET /api/products
  busy: Boolean,
});
const emit = defineEmits(["add"]);

const imageFailed = ref(false);
const soldOut = computed(() => props.product.stock <= 0);
const stockText = computed(() => (soldOut.value ? "Stok habis" : props.product.stock <= 5 ? `Sisa ${props.product.stock}` : "Tersedia"));
</script>

<template>
  <article class="pcard">
    <RouterLink :to="`/shop/${product.id}`" class="thumb" :aria-label="`Lihat ${product.name}`">
      <img
        v-if="product.imageUrl && !imageFailed"
        :src="product.imageUrl"
        :alt="product.name"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imageFailed = true"
      />
      <span v-else class="ph" aria-hidden="true">{{ product.name.charAt(0) }}</span>
      <span v-if="product.discountPct" class="disc">-{{ product.discountPct }}%</span>
    </RouterLink>
    <div class="body">
      <p class="cat">{{ product.category }}</p>
      <h3><RouterLink :to="`/shop/${product.id}`">{{ product.name }}</RouterLink></h3>
      <p class="price">
        <strong>{{ rupiah(product.finalPrice) }}</strong>
        <s v-if="product.discountPct" class="muted">{{ rupiah(product.price) }}</s>
      </p>
      <p class="stock" :class="{ low: !soldOut && product.stock <= 5, out: soldOut }">{{ stockText }}</p>
      <button type="button" class="btn small block add" :disabled="busy || soldOut" @click="emit('add', product)">
        {{ soldOut ? "Habis" : busy ? "Menambahkan..." : "Tambah ke keranjang" }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.pcard { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
.thumb { position: relative; display: block; aspect-ratio: 4 / 3; background: var(--line); }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ph { display: grid; place-items: center; width: 100%; height: 100%; font: 500 3rem var(--serif); color: var(--gold); }
.disc { position: absolute; top: 10px; left: 10px; background: var(--danger); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 2px 10px; border-radius: 99px; }
.body { display: flex; flex-direction: column; gap: 2px; padding: 14px; flex: 1; }
.cat { margin: 0; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold); font-weight: 700; }
h3 { margin: 0; }
h3 a { color: var(--ink); text-decoration: none; }
h3 a:hover { text-decoration: underline; }
.price { margin: 4px 0 0; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.price s { font-size: 0.85rem; }
.stock { margin: 0 0 10px; font-size: 0.82rem; color: var(--ok); flex: 1; }
.stock.low { color: var(--warn); }
.stock.out { color: var(--danger); }
</style>
