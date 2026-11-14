<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import FormField from "../components/FormField.vue";
import { useAuthStore } from "../stores/auth";
import { errorInfo } from "../api/http";
import { canAccess, homeFor, sanitizeRedirect } from "../router/guards";
import { validateEmail } from "../utils/validation";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: "", password: "" });
const errors = reactive({ email: "", password: "" });
const formError = ref("");
const loading = ref(false);

function validate() {
  errors.email = validateEmail(form.email);
  errors.password = form.password ? "" : "Password wajib diisi.";
  return !errors.email && !errors.password;
}

// Where to go after login: the page the user originally wanted (if it is a safe,
// same-site path they are allowed to open), otherwise the dashboard of their role.
function destinationFor(user) {
  const wanted = sanitizeRedirect(route.query.redirect);
  if (wanted) {
    const target = router.resolve(wanted);
    if (target.name !== "not-found" && canAccess(target.meta, user)) return target.fullPath;
  }
  return homeFor(user.role);
}

async function submit() {
  if (loading.value) return;
  formError.value = "";
  if (!validate()) return;

  loading.value = true;
  try {
    const user = await auth.login({ email: form.email.trim(), password: form.password });
    form.password = "";
    await router.replace(destinationFor(user));
  } catch (err) {
    // One generic message for wrong email and wrong password, same as the server.
    formError.value = errorInfo(err, { 401: "Email atau password salah." }).message;
    form.password = "";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-card">
    <h1>Masuk</h1>
    <p class="muted">Selamat datang kembali di Gutarik Kue.</p>

    <form novalidate @submit.prevent="submit">
      <FormField v-model="form.email" label="Email" type="email" autocomplete="username" :error="errors.email" />
      <FormField
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />

      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>

      <button type="submit" class="btn block" :disabled="loading">
        {{ loading ? "Memproses..." : "Masuk" }}
      </button>
    </form>

    <p class="switch">Belum punya akun? <RouterLink to="/register">Daftar sebagai pembeli</RouterLink></p>
  </section>
</template>
