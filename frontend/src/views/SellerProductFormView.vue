<script setup>
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import ProductForm from "../components/ProductForm.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { sellerApi } from "../api/seller";
import { useToastStore } from "../stores/toast";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const id = route.params.id;
const editing = Boolean(id);

const product = ref(null);
const loading = ref(editing);
const notFound = ref(false);
const submitting = ref(false);

onMounted(async () => {
  if (!editing) return;
  try {
    product.value = await sellerApi.getProduct(id);
  } catch (err) {
    if ([400, 404].includes(err.response?.status)) notFound.value = true;
    else toast.fail(err);
  } finally {
    loading.value = false;
  }
});

const FIELDS = ["name", "category", "description", "imageUrl", "price", "discountPct", "stock", "isActive"];

async function onSubmit(values) {
  submitting.value = true;
  try {
    if (!editing) {
      // isActive is not part of the create request (new products are listed once approved)
      const { isActive: _ignored, ...payload } = values;
      await sellerApi.createProduct(payload);
      toast.success("Produk dikirim untuk ditinjau admin.");
    } else {
      // PATCH only what changed, so nothing is overwritten by accident
      const patch = Object.fromEntries(FIELDS.filter((k) => values[k] !== product.value[k]).map((k) => [k, values[k]]));
      if (Object.keys(patch).length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan.");
        return;
      }
      const res = await sellerApi.updateProduct(id, patch);
      toast.success(res.resubmitted ? "Perubahan disimpan. Produk dikirim ulang untuk ditinjau admin." : "Perubahan disimpan.");
    }
    router.push({ name: "seller-products" });
  } catch (err) {
    toast.fail(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="wrap">
    <RouterLink to="/seller/products" class="back">&larr; Produk saya</RouterLink>
    <h1>{{ editing ? "Ubah produk" : "Produk baru" }}</h1>

    <p v-if="loading" class="state muted">Memuat...</p>
    <div v-else-if="notFound" class="auth-card center">
      <h2>Produk tidak ditemukan</h2>
      <RouterLink class="btn" to="/seller/products">Kembali</RouterLink>
    </div>

    <template v-else>
      <template v-if="editing && product">
        <p class="row"><StatusBadge kind="product" :status="product.status" /></p>
        <p v-if="product.status === 'PENDING'" class="banner warn">Menunggu review admin. Produk belum tampil di katalog.</p>
        <p v-else-if="product.status === 'REJECTED'" class="banner error">
          Ditolak: {{ product.rejectionReason }}. Ubah nama, kategori, deskripsi, atau gambar lalu simpan untuk mengajukan ulang.
        </p>
        <p v-else class="banner info">
          Produk tampil di katalog. Mengubah nama, kategori, deskripsi, atau gambar akan mengirimnya kembali ke antrean review.
          Harga, diskon, dan stok bisa diubah kapan saja.
        </p>
      </template>
      <p v-else class="muted">Produk baru akan ditinjau admin sebelum tampil di katalog.</p>

      <ProductForm :initial="product" :submitting="submitting" @submit="onSubmit" />
    </template>
  </section>
</template>
