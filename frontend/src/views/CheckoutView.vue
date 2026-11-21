<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import FormField from "../components/FormField.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { ordersApi } from "../api/orders";
import { errorInfo } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { useToastStore } from "../stores/toast";
import { dateInputValue, formatDeliveryDate, rupiah } from "../utils/format";

const auth = useAuthStore();
const cart = useCartStore();
const toast = useToastStore();

const form = reactive({ recipientName: auth.user?.name ?? "", phone: "", deliveryMethod: "PICKUP", address: "", deliveryDate: "", note: "" });
const errors = reactive({});
const formError = ref("");
const submitting = ref(false);
const placed = ref(null); // { orders, grandTotal } once the checkout succeeded

const minDate = dateInputValue(0);
const maxDate = dateInputValue(90);

onMounted(() => cart.load().catch((err) => toast.fail(err)));

const sellerCount = computed(() => new Set(cart.cart.items.map((i) => i.seller.id)).size);

function validate() {
  const e = {};
  if (form.recipientName.trim().length < 2) e.recipientName = "Nama penerima minimal 2 karakter.";
  if (!/^\+?[0-9]{8,15}$/.test(form.phone.trim().replace(/[\s-]/g, ""))) e.phone = "Nomor telepon tidak valid (8 sampai 15 digit).";
  if (!form.deliveryDate) e.deliveryDate = "Pilih tanggal.";
  else if (form.deliveryDate < minDate || form.deliveryDate > maxDate) e.deliveryDate = "Tanggal harus dari hari ini sampai 90 hari ke depan.";
  if (form.deliveryMethod === "DELIVERY" && form.address.trim().length < 10) e.address = "Alamat lengkap wajib untuk pengantaran (minimal 10 karakter).";
  for (const k of Object.keys(errors)) delete errors[k];
  Object.assign(errors, e);
  return Object.keys(e).length === 0;
}

async function submit() {
  if (submitting.value) return;
  formError.value = "";
  if (!validate()) return;

  // Only fields the API accepts. Prices and totals are always computed by the server.
  const payload = {
    recipientName: form.recipientName.trim(),
    phone: form.phone.trim(),
    deliveryMethod: form.deliveryMethod,
    deliveryDate: form.deliveryDate,
    ...(form.deliveryMethod === "DELIVERY" && { address: form.address.trim() }),
    ...(form.note.trim() && { note: form.note.trim() }),
  };

  submitting.value = true;
  try {
    placed.value = await ordersApi.checkout(payload);
    cart.reset();
    toast.success("Pesanan berhasil dibuat.");
  } catch (err) {
    if (err.response?.status === 401) return;
    const { message, fieldErrors } = errorInfo(err);
    formError.value = message;
    for (const k of ["recipientName", "phone", "deliveryDate", "address"]) if (fieldErrors[k]) errors[k] = fieldErrors[k];
    if (err.response?.status === 409) cart.load().catch(() => {}); // stock or prices changed: show the real cart
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="wrap">
    <!-- after a successful checkout -->
    <div v-if="placed" class="done panel">
      <p class="eyebrow">Terima kasih</p>
      <h1>Pesanan Anda sudah masuk</h1>
      <p class="muted">
        {{ placed.orders.length > 1 ? `Pesanan dipecah menjadi ${placed.orders.length} karena berasal dari penjual berbeda.` : "Penjual akan segera memprosesnya." }}
      </p>
      <ul class="plain-list">
        <li v-for="o in placed.orders" :key="o.id">
          <span><strong class="code">{{ o.code }}</strong> &middot; {{ o.seller.name }} <StatusBadge kind="order" :status="o.status" /></span>
          <strong>{{ rupiah(o.totalAmount) }}</strong>
        </li>
        <li><span>Total</span><strong class="grand">{{ rupiah(placed.grandTotal) }}</strong></li>
      </ul>
      <p class="row">
        <RouterLink class="btn" to="/orders">Lihat pesanan saya</RouterLink>
        <RouterLink class="btn ghost" to="/shop">Belanja lagi</RouterLink>
      </p>
    </div>

    <template v-else>
      <div class="page-head"><h1>Checkout</h1></div>

      <div v-if="cart.cart.items.length === 0 && !cart.loading" class="auth-card center">
        <h2>Keranjang kosong</h2>
        <p class="muted">Tambahkan produk dulu sebelum checkout.</p>
        <RouterLink class="btn" to="/shop">Ke katalog</RouterLink>
      </div>

      <div v-else class="layout">
        <form novalidate class="panel" @submit.prevent="submit">
          <h2>Data pengiriman</h2>
          <FormField v-model="form.recipientName" label="Nama penerima" autocomplete="name" :maxlength="80" :error="errors.recipientName" />
          <FormField v-model="form.phone" label="Nomor telepon" type="tel" autocomplete="tel" placeholder="0812 3456 7890" :error="errors.phone" />

          <div class="field">
            <label for="method">Metode</label>
            <select id="method" v-model="form.deliveryMethod">
              <option value="PICKUP">Ambil sendiri</option>
              <option value="DELIVERY">Diantar ke alamat</option>
            </select>
          </div>
          <FormField
            v-if="form.deliveryMethod === 'DELIVERY'"
            v-model="form.address"
            label="Alamat lengkap"
            multiline
            :rows="3"
            :maxlength="300"
            autocomplete="street-address"
            :error="errors.address"
          />
          <FormField
            v-model="form.deliveryDate"
            :label="form.deliveryMethod === 'DELIVERY' ? 'Tanggal pengantaran' : 'Tanggal pengambilan'"
            type="date"
            :min="minDate"
            :max="maxDate"
            :error="errors.deliveryDate"
            :hint="form.deliveryDate && !errors.deliveryDate ? formatDeliveryDate(form.deliveryDate) : 'Pilih tanggal dari hari ini sampai 90 hari ke depan.'"
          />
          <FormField v-model="form.note" label="Catatan (opsional)" multiline :rows="2" :maxlength="300" placeholder="Contoh: tulisan di atas kue" />

          <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
          <p v-if="!cart.cart.canCheckout" class="banner warn">Ada produk bermasalah di keranjang. <RouterLink to="/cart">Perbaiki di keranjang</RouterLink>.</p>

          <button type="submit" class="btn block" :disabled="submitting || !cart.cart.canCheckout">
            {{ submitting ? "Memproses..." : `Buat pesanan (${rupiah(cart.cart.subtotal)})` }}
          </button>
        </form>

        <aside class="panel summary">
          <h2>Pesanan Anda</h2>
          <ul class="plain-list">
            <li v-for="i in cart.cart.items" :key="i.id">
              <span>{{ i.quantity }} &times; {{ i.name }}</span><strong>{{ rupiah(i.lineTotal) }}</strong>
            </li>
            <li><span>Total</span><strong class="grand">{{ rupiah(cart.cart.subtotal) }}</strong></li>
          </ul>
          <p v-if="sellerCount > 1" class="banner info">Keranjang berisi produk dari {{ sellerCount }} penjual, jadi akan dibuat {{ sellerCount }} pesanan terpisah.</p>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.layout { display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) 350px; align-items: start; }
.layout > form.panel, .summary { border-radius: 28px; padding: 26px; }
.summary { position: sticky; top: 118px; }
.grand { font: 700 1.2rem var(--font-brand); color: var(--slate); }
.code { font: 700 0.95rem var(--font-brand); letter-spacing: 0.06em; color: var(--slate); }
.done { max-width: 640px; margin: 18px auto; border-radius: 30px; padding: 32px; }
@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } .summary { position: static; } }
</style>
