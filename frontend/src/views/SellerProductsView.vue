<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { sellerApi } from "../api/seller";
import { useConfirmStore } from "../stores/confirm";
import { useToastStore } from "../stores/toast";
import { usePagedList } from "../composables/usePagedList";
import { rupiah } from "../utils/format";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABEL } from "../utils/labels";

const toast = useToastStore();
const confirm = useConfirmStore();

const status = ref("");
const q = ref("");
const busyId = ref(null);

const list = usePagedList(
  ({ page, limit }) =>
    sellerApi
      .listProducts({ page, limit, status: status.value || undefined, q: q.value.trim() || undefined })
      .then((d) => ({ items: d.products, meta: d.meta })),
  { limit: 15 }
);

let timer;
watch(q, () => {
  clearTimeout(timer);
  timer = setTimeout(list.reset, 300);
});
watch(status, () => list.reset());
onBeforeUnmount(() => clearTimeout(timer));
onMounted(list.load);

async function toggleVisible(p) {
  busyId.value = p.id;
  try {
    const { product } = await sellerApi.updateProduct(p.id, { isActive: !p.isActive });
    const i = list.items.value.findIndex((x) => x.id === p.id);
    if (i !== -1) list.items.value.splice(i, 1, product);
    toast.success(product.isActive ? `${p.name} tampil lagi di katalog.` : `${p.name} disembunyikan dari katalog.`);
  } catch (err) {
    toast.fail(err);
  } finally {
    busyId.value = null;
  }
}

async function remove(p) {
  const ok = await confirm.ask({
    title: "Hapus produk?",
    message: `"${p.name}" akan dihapus permanen. Produk yang sudah pernah dipesan tidak bisa dihapus, sembunyikan saja.`,
    confirmText: "Hapus produk",
    danger: true,
  });
  if (!ok) return;
  busyId.value = p.id;
  try {
    await sellerApi.removeProduct(p.id);
    toast.success(`${p.name} dihapus.`);
    await list.load();
  } catch (err) {
    toast.fail(err);
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
        <h1>Produk saya</h1>
        <p class="muted">Produk baru tampil di katalog setelah disetujui admin.</p>
      </div>
      <RouterLink class="btn" to="/seller/products/new">Tambah produk</RouterLink>
    </div>

    <div class="toolbar">
      <div class="grow searchbox">
        <label for="q" class="sr-only">Cari produk</label>
        <input id="q" v-model="q" type="search" placeholder="Cari nama produk..." autocomplete="off" />
        <span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span>
      </div>
      <div>
        <label for="status" class="sr-only">Status</label>
        <select id="status" v-model="status">
          <option value="">Semua status</option>
          <option v-for="s in PRODUCT_STATUSES" :key="s" :value="s">{{ PRODUCT_STATUS_LABEL[s] }}</option>
        </select>
      </div>
    </div>

    <div class="table-wrap">
      <StateBlock
        :loading="list.loading.value"
        :error="list.error.value"
        :empty="list.items.value.length === 0"
        empty-text="Belum ada produk. Tambahkan produk pertama Anda."
        @retry="list.load"
      >
        <table class="data-table">
          <caption class="sr-only">Daftar produk saya</caption>
          <thead>
            <tr><th scope="col">Produk</th><th scope="col">Harga</th><th scope="col">Stok</th><th scope="col">Katalog</th><th scope="col">Aksi</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in list.items.value" :key="p.id" :class="{ updating: busyId === p.id }">
              <td data-label="Produk">
                <RouterLink :to="`/seller/products/${p.id}/edit`" class="pname">{{ p.name }}</RouterLink>
                <StatusBadge kind="product" :status="p.status" />
                <span class="muted cat">{{ p.category }}</span>
                <span v-if="p.status === 'REJECTED' && p.rejectionReason" class="error-text reason">Alasan penolakan: {{ p.rejectionReason }}</span>
              </td>
              <td data-label="Harga">
                {{ rupiah(p.finalPrice) }} <s v-if="p.discountPct" class="muted">{{ rupiah(p.price) }}</s>
              </td>
              <td data-label="Stok" :class="{ low: p.stock <= 5 }">{{ p.stock === 0 ? "Habis" : p.stock }}</td>
              <td data-label="Katalog">
                <button type="button" class="link-btn vis" :disabled="busyId !== null" @click="toggleVisible(p)">
                  {{ p.isActive ? "Tampil" : "Disembunyikan" }}
                </button>
              </td>
              <td data-label="Aksi">
                <div class="actions">
                  <RouterLink :to="`/seller/products/${p.id}/edit`" class="btn ghost small">Ubah</RouterLink>
                  <button type="button" class="btn ghost danger small del" :disabled="busyId !== null" @click="remove(p)">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </StateBlock>
    </div>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>

<style scoped>
.pname { font: 600 0.95rem var(--font-body); margin-right: 10px; color: var(--slate); text-decoration: none; }
.pname:hover { text-decoration: underline; text-underline-offset: 3px; }
.cat { display: block; font-size: 0.8rem; margin-top: 2px; }
.reason { display: block; }
.low { color: var(--warn); font-weight: 600; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
