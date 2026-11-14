<script setup>
import { onMounted, ref, watch } from "vue";
import OrderCard from "../components/OrderCard.vue";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import { sellerApi } from "../api/seller";
import { useToastStore } from "../stores/toast";
import { usePagedList } from "../composables/usePagedList";
import { NEXT_ORDER_ACTION, NEXT_ORDER_STATUS, ORDER_STATUSES, ORDER_STATUS_LABEL } from "../utils/labels";

const toast = useToastStore();
const status = ref("");
const busyId = ref(null);

const list = usePagedList(
  ({ page, limit }) =>
    sellerApi.listOrders({ page, limit, status: status.value || undefined }).then((d) => ({ items: d.orders, meta: d.meta })),
  { limit: 10 }
);
watch(status, () => list.reset());
onMounted(list.load);

async function advance(order) {
  busyId.value = order.id;
  try {
    const { order: updated } = await sellerApi.updateOrderStatus(order.id, NEXT_ORDER_STATUS[order.status]);
    toast.success(`${order.code}: ${ORDER_STATUS_LABEL[updated.status]}.`);
    await list.load();
  } catch (err) {
    toast.fail(err);
    list.load();
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <p class="eyebrow">Penjual</p>
        <h1>Pesanan masuk</h1>
        <p class="muted">Geser pesanan satu tahap demi satu tahap sampai selesai.</p>
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
      :empty-text="status ? 'Tidak ada pesanan dengan status ini.' : 'Belum ada pesanan masuk.'"
      @retry="list.load"
    >
      <OrderCard v-for="o in list.items.value" :key="o.id" :order="o" perspective="seller">
        <template v-if="NEXT_ORDER_STATUS[o.status]" #actions>
          <button type="button" class="btn small advance" :disabled="busyId !== null" @click="advance(o)">
            {{ busyId === o.id ? "Menyimpan..." : NEXT_ORDER_ACTION[o.status] }}
          </button>
        </template>
      </OrderCard>
    </StateBlock>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>
