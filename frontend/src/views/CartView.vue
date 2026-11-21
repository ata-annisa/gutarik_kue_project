<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import StateBlock from "../components/StateBlock.vue";
import { useCartStore } from "../stores/cart";
import { useToastStore } from "../stores/toast";
import { useConfirmStore } from "../stores/confirm";
import { errorInfo } from "../api/http";
import { rupiah } from "../utils/format";

const cart = useCartStore();
const toast = useToastStore();
const confirm = useConfirmStore();
const router = useRouter();

const busyId = ref(null);
const loadError = ref("");

async function load() {
  loadError.value = "";
  try {
    await cart.load();
  } catch (err) {
    loadError.value = errorInfo(err).message;
  }
}
onMounted(load);

const MAX_QTY = 50;
const maxFor = (item) => Math.min(item.stock, MAX_QTY);

async function run(item, action) {
  if (busyId.value) return;
  busyId.value = item.id;
  try {
    await action();
  } catch (err) {
    toast.fail(err);
    cart.load().catch(() => {}); // show what the server really has
  } finally {
    busyId.value = null;
  }
}
const setQuantity = (item, q) => run(item, () => cart.setQuantity(item.id, q));

async function remove(item) {
  const ok = await confirm.ask({
    title: "Hapus dari keranjang?",
    message: `${item.name} akan dihapus dari keranjang.`,
    confirmText: "Hapus",
    danger: true,
  });
  if (ok) await run(item, async () => { await cart.remove(item.id); toast.success(`${item.name} dihapus.`); });
}

const issueText = (item) =>
  item.issue === "UNAVAILABLE" ? "Produk ini sudah tidak tersedia. Hapus dari keranjang." : `Stok tinggal ${item.stock}. Kurangi jumlahnya.`;
</script>

<template>
  <section class="wrap">
    <div class="page-head"><h1>Keranjang belanja</h1></div>

    <StateBlock :loading="cart.loading" :error="loadError" :empty="cart.cart.items.length === 0" @retry="load">
      <template #empty>
        <p>Keranjang Anda masih kosong.</p>
        <RouterLink class="btn" to="/shop">Mulai belanja</RouterLink>
      </template>

      <div class="layout">
        <ul class="items plain-list">
          <li v-for="item in cart.cart.items" :key="item.id" class="item" :class="{ bad: item.issue, busy: busyId === item.id }">
            <RouterLink :to="`/shop/${item.productId}`" class="thumb" :aria-label="item.name">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" referrerpolicy="no-referrer" />
              <span v-else class="ph" aria-hidden="true">{{ item.name.charAt(0) }}</span>
            </RouterLink>

            <div class="info">
              <RouterLink :to="`/shop/${item.productId}`" class="name">{{ item.name }}</RouterLink>
              <p class="muted small">Penjual: {{ item.seller.name }}</p>
              <p class="small">
                {{ rupiah(item.unitPrice) }} <s v-if="item.discountPct" class="muted">{{ rupiah(item.price) }}</s>
              </p>
              <p v-if="item.issue" class="error-text issue">{{ issueText(item) }}</p>
            </div>

            <div class="qty" role="group" :aria-label="`Jumlah ${item.name}`">
              <button type="button" aria-label="Kurangi" :disabled="busyId !== null || item.quantity <= 1 || item.issue === 'UNAVAILABLE'" @click="setQuantity(item, item.quantity - 1)">&minus;</button>
              <span class="n">{{ item.quantity }}</span>
              <button type="button" aria-label="Tambah" :disabled="busyId !== null || item.quantity >= maxFor(item) || item.issue === 'UNAVAILABLE'" @click="setQuantity(item, item.quantity + 1)">+</button>
            </div>

            <strong class="line">{{ rupiah(item.lineTotal) }}</strong>
            <button type="button" class="link-btn remove" :disabled="busyId !== null" @click="remove(item)">Hapus</button>
          </li>
        </ul>

        <aside class="panel summary">
          <h2>Ringkasan</h2>
          <p class="row sum"><span>{{ cart.cart.itemCount }} item</span><strong>{{ rupiah(cart.cart.subtotal) }}</strong></p>
          <p class="muted small">Ongkir dan pembayaran diatur langsung dengan penjual. Pesanan dipecah per penjual.</p>
          <p v-if="!cart.cart.canCheckout" class="banner warn">Perbaiki produk bermasalah di atas sebelum checkout.</p>
          <button type="button" class="btn block" :disabled="!cart.cart.canCheckout" @click="router.push('/checkout')">Lanjut ke checkout</button>
        </aside>
      </div>
    </StateBlock>
  </section>
</template>

<style scoped>
.layout { display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) 330px; align-items: start; }
.items { background: var(--cream); border: 1px solid var(--line); border-radius: 28px; padding: 6px 22px; box-shadow: var(--shadow); }
.item { display: grid; grid-template-columns: 78px minmax(0, 1fr) auto 118px auto; gap: 16px; align-items: center; padding: 18px 0; border-bottom: 1px dashed rgba(79, 93, 136, 0.28); transition: opacity 0.2s ease; }
.item:last-child { border-bottom: 0; }
.item.busy { opacity: 0.55; }
.item.bad { background: var(--danger-bg); margin: 0 -22px; padding-left: 22px; padding-right: 22px; }
.thumb { width: 78px; height: 78px; border-radius: 20px; overflow: hidden; background: linear-gradient(140deg, #fce3e0, #f9d2ce); display: block; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.ph { display: grid; place-items: center; width: 100%; height: 100%; font: 400 1.8rem var(--font-display); color: var(--slate); }
.name { font: 600 0.98rem var(--font-body); color: var(--slate); text-decoration: none; }
.name:hover { text-decoration: underline; text-underline-offset: 3px; }
.info p { margin: 2px 0 0; }
.small { font-size: 0.82rem; }
.issue { margin-top: 4px; }
.qty { display: inline-flex; align-items: center; border: 1.5px solid rgba(79, 93, 136, 0.3); border-radius: var(--pill); background: #fff; }
.qty button { width: 36px; height: 36px; border: 0; background: none; font-size: 1.15rem; cursor: pointer; color: var(--slate); border-radius: 50%; transition: background-color 0.15s ease; }
.qty button:hover:not(:disabled) { background: var(--peach); }
.qty button:disabled { opacity: 0.35; cursor: not-allowed; }
.n { min-width: 30px; text-align: center; font-weight: 600; color: var(--slate); }
.line { text-align: right; font: 700 0.98rem var(--font-brand); color: var(--slate); }
.summary { position: sticky; top: 118px; border-radius: 28px; }
.sum { justify-content: space-between; font-size: 1.1rem; }
@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .summary { position: static; } }
@media (max-width: 560px) {
  .item { grid-template-columns: 64px minmax(0, 1fr); }
  .thumb { width: 64px; height: 64px; }
  .qty, .line, .remove { grid-column: 2; justify-self: start; }
}
</style>
