<script setup>
import { computed, reactive, ref } from "vue";
import FormField from "./FormField.vue";
import { rupiah } from "../utils/format";

// Create / edit form for a seller's product. Emits the parsed values; the page decides what to send.
const props = defineProps({
  initial: { type: Object, default: null }, // an existing product (edit) or null (create)
  submitting: Boolean,
});
const emit = defineEmits(["submit"]);

const CATEGORY_HINTS = ["Cake", "Cookies", "Brownies", "Pastry", "Dessert", "Pie", "Roti"];
const p = props.initial;
const form = reactive({
  name: p?.name ?? "",
  category: p?.category ?? "",
  description: p?.description ?? "",
  imageUrl: p?.imageUrl ?? "",
  price: p ? String(p.price) : "",
  discountPct: p ? String(p.discountPct) : "0",
  stock: p ? String(p.stock) : "0",
  isActive: p?.isActive ?? true,
});
const errors = reactive({});
const editing = computed(() => props.initial !== null);

const int = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);

function validate() {
  const e = {};
  const name = form.name.trim();
  if (name.length < 2 || name.length > 120) e.name = "Nama 2 sampai 120 karakter.";
  const category = form.category.trim();
  if (category.length < 2 || category.length > 40) e.category = "Kategori 2 sampai 40 karakter.";
  if (form.description.length > 2000) e.description = "Deskripsi maksimal 2000 karakter.";
  if (form.imageUrl.trim()) {
    try {
      const u = new URL(form.imageUrl.trim());
      if (!["http:", "https:"].includes(u.protocol) || form.imageUrl.length > 500) throw new Error();
    } catch {
      e.imageUrl = "Isi dengan alamat gambar http(s) yang valid, atau kosongkan.";
    }
  }
  const price = int(form.price);
  if (!(price >= 500 && price <= 10_000_000)) e.price = "Harga antara Rp 500 dan Rp 10.000.000 (bilangan bulat).";
  const discount = int(form.discountPct);
  if (!(discount >= 0 && discount <= 90)) e.discountPct = "Diskon 0 sampai 90 persen.";
  const stock = int(form.stock);
  if (!(stock >= 0 && stock <= 100_000)) e.stock = "Stok 0 sampai 100.000 (bilangan bulat).";
  for (const k of Object.keys(errors)) delete errors[k];
  Object.assign(errors, e);
  return Object.keys(e).length === 0;
}

const finalPrice = computed(() => {
  const price = int(form.price);
  const d = int(form.discountPct);
  return Number.isNaN(price) || Number.isNaN(d) || d > 90 ? null : Math.round((price * (100 - d)) / 100);
});

function submit() {
  if (props.submitting || !validate()) return;
  emit("submit", {
    name: form.name.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim() || null,
    price: int(form.price),
    discountPct: int(form.discountPct),
    stock: int(form.stock),
    isActive: form.isActive,
  });
}
</script>

<template>
  <form novalidate class="pform" @submit.prevent="submit">
    <FormField v-model="form.name" label="Nama produk" :maxlength="120" :error="errors.name" />
    <FormField v-model="form.category" label="Kategori" :maxlength="40" list="category-hints" :error="errors.category" />
    <datalist id="category-hints"><option v-for="c in CATEGORY_HINTS" :key="c" :value="c" /></datalist>
    <FormField v-model="form.description" label="Deskripsi" multiline :rows="4" :maxlength="2000" :error="errors.description" />
    <FormField
      v-model="form.imageUrl"
      label="Alamat gambar (opsional)"
      type="url"
      placeholder="https://..."
      hint="Salin alamat gambar dari internet. Unggah file belum tersedia."
      :error="errors.imageUrl"
    />

    <div class="trio">
      <FormField v-model="form.price" label="Harga (Rp)" type="number" min="500" max="10000000" step="1" :error="errors.price" />
      <FormField v-model="form.discountPct" label="Diskon (%)" type="number" min="0" max="90" step="1" :error="errors.discountPct" />
      <FormField v-model="form.stock" label="Stok" type="number" min="0" max="100000" step="1" :error="errors.stock" />
    </div>
    <p v-if="finalPrice !== null" class="muted preview">Harga jual setelah diskon: <strong>{{ rupiah(finalPrice) }}</strong></p>

    <label v-if="editing" class="check">
      <input v-model="form.isActive" type="checkbox" />
      Tampilkan di katalog <span class="muted">(matikan untuk menyembunyikan tanpa menghapus)</span>
    </label>

    <div class="row end">
      <slot name="extra" />
      <button type="submit" class="btn" :disabled="submitting">
        {{ submitting ? "Menyimpan..." : editing ? "Simpan perubahan" : "Kirim untuk ditinjau" }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.pform { background: var(--cream); border: 1px solid var(--line); border-radius: 28px; padding: 30px; max-width: 700px; box-shadow: var(--shadow); }
.trio { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.preview { margin: -6px 0 18px; }
.check { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; font-size: 0.92rem; }
</style>
