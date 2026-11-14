<script setup>
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { homeFor } from "../router/guards";

const auth = useAuthStore();
</script>

<template>
  <section class="auth-card center">
    <h1>Akses ditolak</h1>
    <p class="muted">Akun Anda tidak punya izin untuk membuka halaman ini.</p>
    <RouterLink class="btn" :to="auth.user ? homeFor(auth.user.role) : '/login'">Kembali</RouterLink>
  </section>
</template>
