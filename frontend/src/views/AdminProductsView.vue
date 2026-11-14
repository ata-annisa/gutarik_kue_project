<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Pagination from "../components/Pagination.vue";
import StateBlock from "../components/StateBlock.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { adminApi } from "../api/admin";
import { useConfirmStore } from "../stores/confirm";
import { useToastStore } from "../stores/toast";
import { usePagedList } from "../composables/usePagedList";
import { formatDateTime, rupiah } from "../utils/format";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABEL } from "../utils/labels";

const toast = useToastStore();
const confirm = useConfirmStore();

const status = ref("PENDING"); // the review queue first
const q = ref("");
const busyId = ref(null);

const list = usePagedList(
  ({ page, limit }) =>
    adminApi
      .listProducts({ page, limit, status: status.value || undefined, q: q.value.trim() || undefined })
      .then((d) => ({ items: d.products, meta: d.meta })),
  { limit: 10 }
);

let timer;
watch(q, () => {
  clearTimeout(timer);
  timer = setTimeout(list.reset, 300);
});
watch(status, () => list.reset());
onBeforeUnmount(() => clearTimeout(timer));
onMounted(list.load);

async function decide(p, action) {
  busyId.value = p.id;
  try {
    await action();
    await list.load();
  } catch (err) {
    toast.fail(err);
  } finally {
    busyId.value = null;
  }
}

const approve = (p) =>
  decide(p, async () => {
    const { changed } = await adminApi.approveProduct(p.id);
    if (changed) toast.success(`${p.name} disetujui dan tampil di katalog.`);
    else toast.info(`${p.name} sudah disetujui.`);
  });

async function reject(p) {
  const reason = await confirm.prompt({
    title: p.status === "APPROVED" ? "Turunkan produk?" : "Tolak produk?",
    message: `Tulis alasan untuk "${p.name}". Penjual akan membacanya.${p.status === "APPROVED" ? "\nProduk akan langsung hilang dari katalog." : ""}`,
    confirmText: p.status === "APPROVED" ? "Turunkan produk" : "Tolak produk",
    danger: true,
    prompt: { label: "Alasan", placeholder: "Contoh: foto tidak sesuai dengan produk", minLength: 3, maxLength: 500 },
  });
  if (reason === null) return;
  await decide(p, async () => {
    await adminApi.rejectProduct(p.id, reason);
    toast.success(`${p.name} ditolak.`);
  });
}
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Moderasi produk</h1>
        <p class="muted">Produk baru tidak tampil di katalog sebelum Anda menyetujuinya.</p>
      </div>
    </div>

    <div class="toolbar">
      <div class="grow">
        <label for="q" class="sr-only">Cari produk</label>
        <input id="q" v-model="q" type="search" placeholder="Cari nama produk..." autocomplete="off" />
      </div>
      <div>
        <label for="status" class="sr-only">Status</label>
        <select id="status" v-model="status">
          <option value="">Semua status</option>
          <option v-for="s in PRODUCT_STATUSES" :key="s" :value="s">{{ PRODUCT_STATUS_LABEL[s] }}</option>
        </select>
      </div>
    </div>

    <p v-if="!list.error.value && !list.loading.value" class="count">{{ list.meta.value.total }} produk</p>

    <StateBlock
      :loading="list.loading.value"
      :error="list.error.value"
      :empty="list.items.value.length === 0"
      :empty-text="status === 'PENDING' ? 'Tidak ada produk yang menunggu review.' : 'Tidak ada produk.'"
      @retry="list.load"
    >
      <article v-for="p in list.items.value" :key="p.id" class="prod" :class="{ busy: busyId === p.id }">
        <div class="pic">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" loading="lazy" referrerpolicy="no-referrer" />
          <span v-else class="ph" aria-hidden="true">{{ p.name.charAt(0) }}</span>
        </div>
        <div class="info">
          <h3>{{ p.name }} <StatusBadge kind="product" :status="p.status" /></h3>
          <p class="muted meta">{{ p.category }} &middot; Penjual: {{ p.seller.name }} ({{ p.seller.email }}) &middot; diajukan {{ formatDateTime(p.createdAt) }}</p>
          <p class="meta">
            <strong>{{ rupiah(p.finalPrice) }}</strong>
            <span v-if="p.discountPct" class="muted"> (harga normal {{ rupiah(p.price) }}, diskon {{ p.discountPct }}%)</span>
            &middot; stok {{ p.stock }}
          </p>
          <p v-if="p.description" class="desc">{{ p.description }}</p>
          <p v-if="p.status === 'REJECTED' && p.rejectionReason" class="error-text">Alasan penolakan: {{ p.rejectionReason }}</p>
        </div>
        <div class="actions">
          <button v-if="p.status !== 'APPROVED'" type="button" class="btn small approve" :disabled="busyId !== null" @click="approve(p)">Setujui</button>
          <button v-if="p.status !== 'REJECTED'" type="button" class="btn ghost danger small reject" :disabled="busyId !== null" @click="reject(p)">
            {{ p.status === "APPROVED" ? "Turunkan" : "Tolak" }}
          </button>
        </div>
      </article>
    </StateBlock>

    <Pagination :meta="list.meta.value" @change="list.goTo" />
  </section>
</template>

<style scoped>
.prod { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 16px; align-items: start; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px; margin-bottom: 14px; }
.prod.busy { opacity: 0.55; }
.pic { width: 110px; height: 90px; border-radius: 6px; overflow: hidden; background: var(--line); }
.pic img { width: 100%; height: 100%; object-fit: cover; }
.ph { display: grid; place-items: center; width: 100%; height: 100%; font: 500 2rem var(--serif); color: var(--gold); }
h3 { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.meta { margin: 2px 0; font-size: 0.88rem; }
.desc { margin: 6px 0 0; font-size: 0.92rem; white-space: pre-line; }
.actions { display: flex; flex-direction: column; gap: 8px; }
@media (max-width: 640px) { .prod { grid-template-columns: 80px minmax(0, 1fr); } .pic { width: 80px; height: 70px; } .actions { grid-column: 1 / -1; flex-direction: row; } }
</style>
