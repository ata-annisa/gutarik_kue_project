<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import BarChart from "../components/BarChart.vue";
import StatCard from "../components/StatCard.vue";
import StateBlock from "../components/StateBlock.vue";
import { adminApi } from "../api/admin";
import { errorInfo } from "../api/http";
import { compactRupiah, rupiah, shortDay } from "../utils/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "../utils/labels";
import { ROLE_LABEL } from "../utils/validation";

const stats = ref(null);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    stats.value = await adminApi.stats();
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
        <p class="eyebrow">Admin</p>
        <h1>Dasbor admin</h1>
        <p class="muted">Gambaran seluruh sistem.</p>
      </div>
    </div>

    <StateBlock :loading="loading" :error="error" :empty="!stats" @retry="load">
      <template v-if="stats">
        <p v-if="stats.products.awaitingReview" class="banner warn">
          {{ stats.products.awaitingReview }} produk menunggu review. <RouterLink to="/admin/products">Tinjau sekarang</RouterLink>.
        </p>

        <div class="stat-grid">
          <StatCard label="Pengguna" :value="stats.users.total" :hint="`${stats.users.active} aktif, ${stats.users.inactive} nonaktif`" />
          <StatCard label="Menunggu review" :value="stats.products.awaitingReview" hint="produk baru" :tone="stats.products.awaitingReview ? 'warn' : ''" />
          <StatCard label="Total pesanan" :value="stats.orders.total" />
          <StatCard label="Pendapatan" :value="rupiah(stats.orders.revenue)" hint="pesanan selesai" tone="ok" />
          <StatCard label="Dalam proses" :value="rupiah(stats.orders.pipeline)" hint="pesanan belum selesai" />
          <StatCard label="Produk" :value="stats.products.total" :hint="`${stats.products.byStatus.APPROVED} disetujui`" />
        </div>

        <div class="two-col section">
          <div class="panel"><BarChart title="Pesanan 7 hari terakhir" :items="ordersChart" /></div>
          <div class="panel"><BarChart title="Pendapatan 7 hari terakhir (selesai)" :items="revenueChart" /></div>
        </div>

        <div class="two-col section">
          <div class="panel">
            <h2>Pengguna menurut role</h2>
            <ul class="plain-list">
              <li v-for="(n, role) in stats.users.byRole" :key="role"><span>{{ ROLE_LABEL[role] }}</span><strong>{{ n }}</strong></li>
            </ul>
          </div>
          <div class="panel">
            <h2>Pesanan menurut status</h2>
            <ul class="plain-list">
              <li v-for="s in ORDER_STATUSES" :key="s"><span>{{ ORDER_STATUS_LABEL[s] }}</span><strong>{{ stats.orders.byStatus[s] }}</strong></li>
            </ul>
          </div>
        </div>

        <ul class="cards">
          <li>
            <RouterLink to="/admin/users" class="card live"><h2>Pengguna</h2><p>Ubah role, blokir atau aktifkan akun.</p><span class="open">Buka</span></RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/products" class="card live"><h2>Moderasi produk</h2><p>Setujui atau tolak produk penjual.</p><span class="open">Buka</span></RouterLink>
          </li>
          <li>
            <RouterLink to="/admin/orders" class="card live"><h2>Semua pesanan</h2><p>Audit pesanan dari semua penjual.</p><span class="open">Buka</span></RouterLink>
          </li>
        </ul>
      </template>
    </StateBlock>
  </section>
</template>
