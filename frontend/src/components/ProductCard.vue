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
.pcard { display: flex; flex-direction: column; background: var(--cream); border: 1px solid var(--line); border-radius: 26px; overflow: hidden; box-shadow: var(--shadow); transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease; }
.pcard:hover { transform: translateY(-7px); box-shadow: var(--shadow-hover); border-color: rgba(79, 93, 136, 0.42); }
.thumb { position: relative; display: block; aspect-ratio: 4 / 3; background: linear-gradient(140deg, #fce3e0, #f9d2ce); overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.45s ease; }
.pcard:hover .thumb img { transform: scale(1.07); }
.ph { display: grid; place-items: center; width: 100%; height: 100%; font: 400 3.8rem var(--font-display); color: var(--slate); opacity: 0.78; }
.disc { position: absolute; top: 14px; left: 14px; background: var(--coral); color: #fff; font: 600 0.74rem var(--font-body); padding: 3px 13px; border-radius: var(--pill); box-shadow: 0 5px 12px rgba(226, 109, 101, 0.42); }
.body { display: flex; flex-direction: column; gap: 2px; padding: 18px 20px 20px; flex: 1; }
.cat { margin: 0; font: 500 0.66rem var(--font-body); letter-spacing: 0.22em; text-transform: uppercase; color: var(--slate); }
h3 { margin: 3px 0 0; font: 600 1.04rem/1.3 var(--font-body); }
h3 a { color: var(--slate); text-decoration: none; }
h3 a:hover { text-decoration: underline; text-underline-offset: 3px; }
.price { margin: 9px 0 0; display: flex; gap: 9px; align-items: baseline; flex-wrap: wrap; }
.price strong { font: 700 1.12rem var(--font-brand); color: var(--slate); }
.price s { font-size: 0.8rem; }
.stock { margin: 3px 0 16px; font: 500 0.78rem var(--font-body); color: var(--ok); flex: 1; }
.stock.low { color: var(--warn); }
.stock.out { color: var(--danger); }
</style>
