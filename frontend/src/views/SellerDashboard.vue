<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import BarChart from "../components/BarChart.vue";
import StatCard from "../components/StatCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { sellerApi } from "../api/seller";
import { errorInfo } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { compactRupiah, rupiah, shortDay } from "../utils/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, PRODUCT_STATUSES, PRODUCT_STATUS_LABEL } from "../utils/labels";

const auth = useAuthStore();
const stats = ref(null);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    stats.value = await sellerApi.stats();
  } catch (err) {
    error.value = errorInfo(err).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const ordersChart = computed(() => stats.value.last7Days.map((d) => ({ label: shortDay(d.date), value: d.orders })));
const revenueChart = computed(() =>
  stats.value.last7Days.map((d) => ({ label: shortDay(d.date), value: d.revenue, text: compactRupiah(d.revenue) }))
);
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <p class="eyebrow">Penjual</p>
        <h1>Dasbor toko</h1>
        <p class="muted">Halo {{ auth.user?.name }}. Ini kondisi toko Anda saat ini.</p>
      </div>
      <div class="row">
        <RouterLink class="btn" to="/seller/products/new">Tambah produk</RouterLink>
        <RouterLink class="btn ghost" to="/seller/orders">Pesanan masuk</RouterLink>
      </div>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!stats" @retry="load">
      <template v-if="stats">
        <p v-if="stats.products.byStatus.REJECTED" class="banner error">
          {{ stats.products.byStatus.REJECTED }} produk ditolak admin. <RouterLink to="/seller/products">Lihat alasannya</RouterLink>.
        </p>
        <p v-if="stats.orders.byStatus.PENDING" class="banner warn">
          {{ stats.orders.byStatus.PENDING }} pesanan baru menunggu Anda. <RouterLink to="/seller/orders">Proses sekarang</RouterLink>.
        </p>

        <div class="stat-grid">
          <StatCard label="Pendapatan" :value="rupiah(stats.orders.revenue)" hint="dari pesanan selesai" tone="ok" />
          <StatCard label="Dalam proses" :value="rupiah(stats.orders.pipeline)" hint="pesanan belum selesai" />
          <StatCard label="Total pesanan" :value="stats.orders.total" />
          <StatCard label="Produk" :value="stats.products.total" :hint="`${stats.products.byStatus.PENDING} menunggu review`" />
          <StatCard label="Stok menipis" :value="stats.products.lowStock" :hint="`sisa ${stats.products.lowStockThreshold} atau kurang`" :tone="stats.products.lowStock ? 'warn' : ''" />
          <StatCard label="Stok habis" :value="stats.products.outOfStock" :tone="stats.products.outOfStock ? 'warn' : ''" />
        </div>

        <div class="two-col section">
          <div class="panel"><BarChart title="Pesanan 7 hari terakhir" :items="ordersChart" /></div>
          <div class="panel"><BarChart title="Pendapatan 7 hari terakhir (selesai)" :items="revenueChart" /></div>
        </div>

        <div class="two-col section">
          <div class="panel">
            <h2>Pesanan menurut status</h2>
            <ul class="plain-list">
              <li v-for="s in ORDER_STATUSES" :key="s"><span>{{ ORDER_STATUS_LABEL[s] }}</span><strong>{{ stats.orders.byStatus[s] }}</strong></li>
            </ul>
          </div>
          <div class="panel">
            <h2>Produk menurut status</h2>
            <ul class="plain-list">
              <li v-for="s in PRODUCT_STATUSES" :key="s"><span>{{ PRODUCT_STATUS_LABEL[s] }}</span><strong>{{ stats.products.byStatus[s] }}</strong></li>
            </ul>
          </div>
        </div>

        <div class="panel section">
          <h2>Produk terlaris</h2>
          <p v-if="stats.topProducts.length === 0" class="muted">Belum ada pesanan selesai.</p>
          <ul v-else class="plain-list">
            <li v-for="t in stats.topProducts" :key="t.productId"><span>{{ t.name }}</span><strong>{{ t.unitsSold }} terjual</strong></li>
          </ul>
        </div>
      </template>
    </StateBlock>
  </section>
</template>
