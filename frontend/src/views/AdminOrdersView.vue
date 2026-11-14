<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import OrderCard from "../components/OrderCard.vue";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import { adminApi } from "../api/admin";
import { usePagedList } from "../composables/usePagedList";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "../utils/labels";

const status = ref("");
const sellerId = ref("");
const code = ref("");
const sellers = ref([]);

const list = usePagedList(
  ({ page, limit }) =>
    adminApi
      .listOrders({
        page,
        limit,
        status: status.value || undefined,
        sellerId: sellerId.value || undefined,
        code: code.value.trim() || undefined,
      })
      .then((d) => ({ items: d.orders, meta: d.meta })),
  { limit: 10 }
);

let timer;
watch(code, () => {
  clearTimeout(timer);
  timer = setTimeout(list.reset, 300);
});
watch([status, sellerId], () => list.reset());
onBeforeUnmount(() => clearTimeout(timer));

onMounted(() => {
  list.load();
  // the seller filter lists every account that currently has the SELLER role
  adminApi.listAllUsers().then(({ users }) => (sellers.value = users.filter((u) => u.role === "SELLER"))).catch(() => {});
});
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Semua pesanan</h1>
        <p class="muted">Audit pesanan dari seluruh penjual. Hanya untuk dilihat.</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="grow">
        <label for="code" class="sr-only">Cari kode pesanan</label>
        <input id="code" v-model="code" type="search" placeholder="Cari kode pesanan, contoh: GK-7H3K" autocomplete="off" />
      </div>
      <div>
        <label for="status" class="sr-only">Status</label>
        <select id="status" v-model="status">
          <option value="">Semua status</option>
          <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ ORDER_STATUS_LABEL[s] }}</option>
        </select>
      </div>
      <div>
        <label for="seller" class="sr-only">Penjual</label>
        <select id="seller" v-model="sellerId">
          <option value="">Semua penjual</option>
          <option v-for="s in sellers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <p v-if="!list.error.value && !list.loading.value" class="count">{{ list.meta.value.total }} pesanan</p>

    <StateBlock
      :loading="list.loading.value"
      :error="list.error.value"
      :empty="list.items.value.length === 0"
      empty-text="Tidak ada pesanan yang cocok."
      @retry="list.load"
    >
      <OrderCard v-for="o in list.items.value" :key="o.id" :order="o" perspective="admin" />
    </StateBlock>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>
