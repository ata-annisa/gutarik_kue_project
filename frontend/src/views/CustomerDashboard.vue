<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import OrderCard from "../components/OrderCard.vue";
import StatCard from "../components/StatCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { ordersApi } from "../api/orders";
import { errorInfo } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { rupiah } from "../utils/format";

const auth = useAuthStore();
const cart = useCartStore();

const loading = ref(true);
const error = ref("");
const recent = ref([]);
const total = ref(0);
const active = ref(0);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [latest, ...running] = await Promise.all([
      ordersApi.list({ limit: 3 }),
      // "active" = not delivered yet. One cheap call per status, only the total is read.
      ...["PENDING", "PROCESSING", "SHIPPED"].map((status) => ordersApi.list({ limit: 1, status })),
    ]);
    recent.value = latest.orders;
    total.value = latest.meta.total;
    active.value = running.reduce((n, r) => n + r.meta.total, 0);
    await cart.load();
  } catch (err) {
    error.value = errorInfo(err).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<template>
  <section class="wrap">
    <p class="eyebrow">Pembeli</p>
    <h1>Halo, {{ auth.user?.name }}</h1>
    <p class="muted">Berikut ringkasan belanja Anda.</p>

    <StateBlock :loading="loading" :error="error" :empty="false" @retry="load">
      <div class="stat-grid">
        <StatCard label="Isi keranjang" :value="cart.itemCount" hint="item siap di-checkout" />
        <StatCard label="Pesanan aktif" :value="active" hint="belum selesai" :tone="active ? 'ok' : ''" />
        <StatCard label="Semua pesanan" :value="total" />
        <StatCard label="Nilai keranjang" :value="rupiah(cart.cart.subtotal)" />
      </div>

      <div class="row section">
        <RouterLink class="btn" to="/shop">Belanja kue</RouterLink>
        <RouterLink class="btn ghost" to="/cart">Lihat keranjang</RouterLink>
        <RouterLink class="btn ghost" to="/orders">Semua pesanan</RouterLink>
      </div>

      <div class="section">
        <h2>Pesanan terbaru</h2>
        <p v-if="recent.length === 0" class="muted">Belum ada pesanan. <RouterLink to="/shop">Mulai belanja</RouterLink>.</p>
        <OrderCard v-for="o in recent" :key="o.id" :order="o" perspective="customer" />
      </div>
    </StateBlock>
  </section>
</template>
