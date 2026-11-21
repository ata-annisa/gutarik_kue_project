<script setup>
import { computed, ref } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { rupiah, formatDateTime, formatDeliveryDate } from "../utils/format";
import { DELIVERY_LABEL, ORDER_STATUSES, ORDER_STATUS_LABEL } from "../utils/labels";

const props = defineProps({
  order: { type: Object, required: true },
  perspective: { type: String, default: "customer" }, // "customer" | "seller" | "admin": who is looking
  defaultOpen: Boolean,
});

const open = ref(props.defaultOpen);
const stepIndex = computed(() => ORDER_STATUSES.indexOf(props.order.status));
const who = (u) => (props.perspective === "admin" && u.email ? `${u.name} (${u.email})` : u.name);
</script>

<template>
  <article class="ocard" :data-status="order.status">
    <header>
      <div class="title">
        <strong class="code">{{ order.code }}</strong>
        <StatusBadge kind="order" :status="order.status" />
      </div>
      <span class="when muted">{{ formatDateTime(order.createdAt) }}</span>
    </header>

    <ol class="steps" aria-label="Progres pesanan">
      <li v-for="(s, i) in ORDER_STATUSES" :key="s" :class="{ done: i <= stepIndex, current: i === stepIndex }">
        {{ ORDER_STATUS_LABEL[s] }}
      </li>
    </ol>

    <dl class="who">
      <template v-if="perspective === 'customer'">
        <div><dt>Penjual</dt><dd>{{ order.seller.name }}</dd></div>
      </template>
      <template v-else-if="perspective === 'seller'">
        <div><dt>Pembeli</dt><dd>{{ order.customer.name }}</dd></div>
        <div><dt>Penerima</dt><dd>{{ order.recipientName }} &middot; {{ order.phone }}</dd></div>
      </template>
      <template v-else>
        <div><dt>Pembeli</dt><dd>{{ who(order.customer) }}</dd></div>
        <div><dt>Penjual</dt><dd>{{ who(order.seller) }}</dd></div>
      </template>
      <div><dt>{{ DELIVERY_LABEL[order.deliveryMethod] }}</dt><dd>{{ formatDeliveryDate(order.deliveryDate) }}</dd></div>
    </dl>

    <p class="sum">
      {{ order.items.length }} produk &middot; <strong class="total">{{ rupiah(order.totalAmount) }}</strong>
      <button type="button" class="link-btn toggle" :aria-expanded="open" @click="open = !open">
        {{ open ? "Sembunyikan rincian" : "Lihat rincian" }}
      </button>
    </p>

    <div v-if="open" class="detail">
      <ul class="plain-list items">
        <li v-for="i in order.items" :key="i.id">
          <span>{{ i.quantity }} &times; {{ i.productName }} <span class="muted">({{ rupiah(i.unitPrice) }})</span></span>
          <strong>{{ rupiah(i.lineTotal) }}</strong>
        </li>
      </ul>
      <p v-if="perspective !== 'customer'" class="line"><span class="muted">Penerima:</span> {{ order.recipientName }}, {{ order.phone }}</p>
      <p v-if="order.address" class="line"><span class="muted">Alamat:</span> {{ order.address }}</p>
      <p v-if="order.note" class="line"><span class="muted">Catatan:</span> {{ order.note }}</p>
    </div>

    <footer v-if="$slots.actions"><slot name="actions" /></footer>
  </article>
</template>

<style scoped>
.ocard { background: var(--cream); border: 1px solid var(--line); border-radius: 26px; padding: 22px 24px; margin-bottom: 20px; box-shadow: var(--shadow); transition: box-shadow 0.22s ease, border-color 0.22s ease; }
.ocard:hover { box-shadow: var(--shadow-hover); border-color: rgba(79, 93, 136, 0.38); }
header { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.title { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.code { font: 700 0.98rem var(--font-brand); letter-spacing: 0.07em; color: var(--slate); }
.when { font-size: 0.8rem; }
.steps { list-style: none; display: flex; gap: 8px; padding: 0; margin: 18px 0; }
.steps li { flex: 1; text-align: center; font: 500 0.7rem var(--font-body); padding: 8px 4px; border-radius: var(--pill); background: var(--peach); color: var(--muted); transition: background-color 0.2s ease; }
.steps li.done { background: var(--slate-wash); color: var(--slate); }
.steps li.current { background: var(--slate); color: #fff; font-weight: 600; box-shadow: 0 6px 14px rgba(79, 93, 136, 0.28); }
.who { display: grid; gap: 5px; margin: 0 0 10px; font-size: 0.9rem; }
.who div { display: flex; gap: 10px; }
dt { color: var(--slate); font-weight: 600; min-width: 118px; }
dd { margin: 0; }
.sum { margin: 8px 0; display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
.total { font: 700 1.05rem var(--font-brand); color: var(--slate); }
.toggle { margin-left: auto; font-size: 0.85rem; }
.detail { border-top: 1px dashed rgba(79, 93, 136, 0.3); padding-top: 12px; margin-top: 8px; }
.line { margin: 7px 0 0; font-size: 0.88rem; }
footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; flex-wrap: wrap; }
@media (max-width: 560px) { .steps { gap: 4px; } .steps li { font-size: 0.6rem; padding: 7px 2px; } dt { min-width: 84px; } }
</style>
