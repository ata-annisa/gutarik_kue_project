<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { errorInfo } from "../api/http";
import { homeFor } from "../router/guards";
import { validateEmail, validateName, validateNewPassword } from "../utils/validation";

const auth = useAuthStore();
const router = useRouter();

const form = reactive({ name: "", email: "", password: "", confirm: "" });
const errors = reactive({ name: "", email: "", password: "", confirm: "" });
const formError = ref("");
const loading = ref(false);

function validate() {
  errors.name = validateName(form.name);
  errors.email = validateEmail(form.email);
  errors.password = validateNewPassword(form.password);
  errors.confirm = form.confirm === form.password ? "" : "Konfirmasi password tidak sama.";
  return !errors.name && !errors.email && !errors.password && !errors.confirm;
}

async function submit() {
  if (loading.value) return;
  formError.value = "";
  if (!validate()) return;

  loading.value = true;
  try {
    // Only name, email and password are sent. The server decides the role (always CUSTOMER).
    const user = await auth.register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    await router.replace(homeFor(user.role));
  } catch (err) {
    const { message, fieldErrors } = errorInfo(err, { 409: "Email ini sudah terdaftar. Coba masuk." });
    formError.value = message;
    for (const key of ["name", "email", "password"]) if (fieldErrors[key]) errors[key] = fieldErrors[key];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-card">
    <h1>Buat akun</h1>
    <p class="muted">Daftar sebagai pembeli untuk memesan kue.</p>

    <form novalidate @submit.prevent="submit">
      <FormField v-model="form.name" label="Nama lengkap" autocomplete="name" :maxlength="80" :error="errors.name" />
      <FormField v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <FormField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        hint="Minimal 10 karakter, mengandung huruf dan angka."
        :error="errors.password"
      />
      <FormField
        v-model="form.confirm"
        label="Ulangi password"
        type="password"
        autocomplete="new-password"
        :error="errors.confirm"
      />

      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>

      <button type="submit" class="btn block" :disabled="loading">
        {{ loading ? "Memproses..." : "Daftar" }}
      </button>
    </form>

    <p class="note">Akun penjual dan admin dibuat oleh administrator, tidak lewat form ini.</p>
    <p class="switch">Sudah punya akun? <RouterLink to="/login">Masuk</RouterLink></p>
  </section>
</template>
