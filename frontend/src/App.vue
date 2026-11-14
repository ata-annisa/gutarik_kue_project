<script setup>
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import ToastHost from "./components/ToastHost.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

const route = useRoute();
</script>

<template>
  <a class="skip-link" href="#main">Lewati ke konten</a>
  <AppHeader />
  <main id="main">
    <!-- keyed by path so /seller/products/new and /seller/products/:id/edit never share form state -->
    <RouterView :key="route.path" />
  </main>
  <ToastHost />
  <ConfirmDialog />
</template>
