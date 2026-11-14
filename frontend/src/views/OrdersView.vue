<script setup>
import { onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import OrderCard from "../components/OrderCard.vue";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import { ordersApi } from "../api/orders";
import { usePagedList } from "../composables/usePagedList";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "../utils/labels";

const status = ref("");
const list = usePagedList(
  ({ page, limit }) =>
    ordersApi.list({ page, limit, status: status.value || undefined }).then((d) => ({ items: d.orders, meta: d.meta })),
  { limit: 10 }
);

watch(status, () => list.reset());
onMounted(list.load);
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <h1>Pesanan saya</h1>
        <p class="muted">Pantau status setiap pesanan Anda.</p>
      </div>
      <div>
        <label for="status" class="sr-only">Filter status</label>
        <select id="status" v-model="status">
          <option value="">Semua status</option>
          <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ ORDER_STATUS_LABEL[s] }}</option>
        </select>
      </div>
    </div>

    <StateBlock
      :loading="list.loading.value"
      :error="list.error.value"
      :empty="list.items.value.length === 0"
      :empty-text="status ? 'Tidak ada pesanan dengan status ini.' : 'Anda belum punya pesanan.'"
      @retry="list.load"
    >
      <template #empty>
        <p>{{ status ? "Tidak ada pesanan dengan status ini." : "Anda belum punya pesanan." }}</p>
        <RouterLink v-if="!status" class="btn" to="/shop">Mulai belanja</RouterLink>
      </template>
      <OrderCard v-for="o in list.items.value" :key="o.id" :order="o" perspective="customer" />
    </StateBlock>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>
