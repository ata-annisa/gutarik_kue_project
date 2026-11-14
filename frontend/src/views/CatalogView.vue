<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import ProductCard from "../components/ProductCard.vue";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import { catalogApi } from "../api/catalog";
import { useAuthStore } from "../stores/auth";
import { useAddToCart } from "../composables/useAddToCart";
import { usePagedList } from "../composables/usePagedList";
import { ROLE_LABEL } from "../utils/validation";

const auth = useAuthStore();
const { busyId, addToCart } = useAddToCart();

const q = ref("");
const category = ref("");
const sort = ref("newest");
const categories = ref([]);

const list = usePagedList(
  ({ page, limit }) =>
    catalogApi
      .listProducts({ page, limit, q: q.value.trim() || undefined, category: category.value || undefined, sort: sort.value })
      .then((d) => ({ items: d.products, meta: d.meta })),
  { limit: 12 }
);

let timer;
watch(q, () => {
  clearTimeout(timer);
  timer = setTimeout(list.reset, 300); // wait until the user stops typing
});
watch([category, sort], () => list.reset());
onBeforeUnmount(() => clearTimeout(timer));

onMounted(() => {
  list.load();
  catalogApi.listCategories().then((c) => (categories.value = c)).catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <h1>Katalog kue</h1>
        <p class="muted">Semua produk sudah ditinjau dan siap dipesan.</p>
      </div>
    </div>

    <p v-if="auth.user && auth.user.role !== 'CUSTOMER'" class="banner info">
      Anda masuk sebagai {{ ROLE_LABEL[auth.user.role] }}. Hanya akun pembeli yang dapat berbelanja.
    </p>

    <div class="toolbar">
      <div class="grow">
        <label for="q" class="sr-only">Cari produk</label>
        <input id="q" v-model="q" type="search" placeholder="Cari nama kue..." autocomplete="off" />
      </div>
      <div>
        <label for="category" class="sr-only">Kategori</label>
        <select id="category" v-model="category">
          <option value="">Semua kategori</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div>
        <label for="sort" class="sr-only">Urutkan</label>
        <select id="sort" v-model="sort">
          <option value="newest">Terbaru</option>
          <option value="price_asc">Harga terendah</option>
          <option value="price_desc">Harga tertinggi</option>
          <option value="name">Nama A-Z</option>
        </select>
      </div>
    </div>

    <p v-if="!list.error.value && !list.loading.value" class="count">{{ list.meta.value.total }} produk</p>

    <StateBlock
      :loading="list.loading.value"
      :error="list.error.value"
      :empty="list.items.value.length === 0"
      empty-text="Tidak ada produk yang cocok."
      @retry="list.load"
    >
      <div class="grid-cards">
        <ProductCard v-for="p in list.items.value" :key="p.id" :product="p" :busy="busyId === p.id" @add="addToCart" />
      </div>
    </StateBlock>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>
