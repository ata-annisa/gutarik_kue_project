<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { adminApi } from "../api/admin";
import { errorInfo } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useConfirmStore } from "../stores/confirm";
import { useToastStore } from "../stores/toast";
import { ROLE_LABEL } from "../utils/validation";

const ROLE_OPTIONS = ["ADMIN", "SELLER", "CUSTOMER"];

const auth = useAuthStore();
const toast = useToastStore();
const confirm = useConfirmStore();

const users = ref([]);
const serverTotal = ref(0);
const searchQuery = ref("");
const selectedRoleFilter = ref(""); // "" = all roles
const loading = ref(false);
const loadError = ref("");
const updatingId = ref(null); // id of the row currently being saved

const isSelf = (user) => user.id === auth.user?.id;

// Search + role filter run in the browser over the loaded list.
const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return users.value.filter((u) => {
    if (selectedRoleFilter.value && u.role !== selectedRoleFilter.value) return false;
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
});
const notFullyLoaded = computed(() => users.value.length < serverTotal.value);

// The API is paginated, so walk every page. Otherwise the filter would only see the first page.
async function fetchUsers() {
  loading.value = true;
  loadError.value = "";
  try {
    const { users: all, total } = await adminApi.listAllUsers();
    users.value = all;
    serverTotal.value = total;
  } catch (err) {
    loadError.value = errorInfo(err).message;
  } finally {
    loading.value = false;
  }
}
onMounted(fetchUsers);

// Shared by role and status changes. Returns the server's answer, or null if it failed.
async function patchRow(user, call) {
  updatingId.value = user.id;
  try {
    const data = await call();
    const i = users.value.findIndex((u) => u.id === user.id);
    if (i !== -1) users.value.splice(i, 1, data.user); // trust the server's copy of the row
    return data;
  } catch (err) {
    toast.fail(err);
    return null;
  } finally {
    updatingId.value = null;
  }
}

// selectEl is the <select> that fired the change. A native select shows the new value
// before we know whether the user confirmed or the server accepted it, so we put it back.
async function handleRoleChange(user, newRole, selectEl) {
  const revert = () => {
    if (selectEl) selectEl.value = user.role;
  };
  if (newRole === user.role) return;
  if (updatingId.value !== null) return revert();

  let message = `Ubah role ${user.name} dari ${ROLE_LABEL[user.role]} menjadi ${ROLE_LABEL[newRole]}?\n\nPengguna akan keluar dari sesi login dan harus masuk lagi.`;
  if (newRole === "ADMIN") message += "\n\nPERHATIAN: Admin punya akses penuh ke seluruh sistem.";
  const ok = await confirm.ask({ title: "Ubah role pengguna?", message, confirmText: "Ubah role", danger: newRole === "ADMIN" });
  if (!ok) return revert();

  const data = await patchRow(user, () => adminApi.updateUserRole(user.id, newRole));
  if (!data) return revert();
  if (data.changed) toast.success(`Role ${data.user.name} sekarang ${ROLE_LABEL[data.user.role]}. Sesi lamanya sudah dicabut.`);
  else toast.info(`Tidak ada perubahan untuk ${data.user.name}.`);
}

async function toggleUserStatus(user) {
  if (updatingId.value !== null) return;
  const next = !user.isActive;
  const ok = await confirm.ask({
    title: next ? "Aktifkan akun?" : "Blokir akun?",
    message: next
      ? `Aktifkan kembali akun ${user.name}?`
      : `Nonaktifkan akun ${user.name}?\n\nPengguna akan langsung keluar dan tidak bisa masuk sampai akunnya diaktifkan lagi.`,
    confirmText: next ? "Aktifkan" : "Blokir akun",
    danger: !next,
  });
  if (!ok) return;

  const data = await patchRow(user, () => adminApi.updateUserStatus(user.id, next));
  if (!data) return;
  if (data.changed) toast.success(`Akun ${data.user.name} ${data.user.isActive ? "diaktifkan kembali" : "dinonaktifkan"}.`);
  else toast.info(`Tidak ada perubahan untuk ${data.user.name}.`);
}
</script>

<template>
  <section class="wrap">
    <div class="page-head">
      <div>
        <RouterLink to="/admin" class="back">&larr; Dasbor admin</RouterLink>
        <h1>Manajemen pengguna</h1>
        <p class="muted">Ubah role dan blokir atau aktifkan akun. Perubahan langsung mengakhiri sesi pengguna terkait.</p>
      </div>
      <button type="button" class="btn ghost small" :disabled="loading" @click="fetchUsers">{{ loading ? "Memuat..." : "Muat ulang" }}</button>
    </div>

    <div class="toolbar">
      <div class="grow searchbox">
        <label for="user-search" class="sr-only">Cari nama atau email</label>
        <input id="user-search" v-model="searchQuery" type="search" placeholder="Cari nama atau email..." autocomplete="off" />
        <span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></span>
      </div>
      <div>
        <label for="role-filter" class="sr-only">Filter role</label>
        <select id="role-filter" v-model="selectedRoleFilter">
          <option value="">Semua role</option>
          <option v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
        </select>
      </div>
    </div>

    <p v-if="!loading && !loadError" class="count">
      Menampilkan {{ filteredUsers.length }} dari {{ users.length }} pengguna
      <span v-if="notFullyLoaded">(hanya {{ users.length }} dari {{ serverTotal }} yang dimuat)</span>
    </p>

    <div class="table-wrap">
      <p v-if="loading && users.length === 0" class="state">Memuat pengguna...</p>
      <div v-else-if="loadError" class="state">
        <p class="error-text">{{ loadError }}</p>
        <button type="button" class="btn small" @click="fetchUsers">Coba lagi</button>
      </div>
      <p v-else-if="filteredUsers.length === 0" class="state">
        {{ users.length === 0 ? "Belum ada pengguna." : "Tidak ada pengguna yang cocok dengan pencarian." }}
      </p>

      <table v-else class="data-table">
        <caption class="sr-only">Daftar pengguna</caption>
        <thead>
          <tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Aksi</th></tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" :class="{ updating: updatingId === user.id }">
            <td data-label="Nama">
              {{ user.name }}
              <span v-if="isSelf(user)" class="you">Anda</span>
            </td>
            <td data-label="Email" class="email">{{ user.email }}</td>
            <td data-label="Role">
              <select
                :value="user.role"
                :aria-label="`Role untuk ${user.name}`"
                :disabled="isSelf(user) || updatingId !== null"
                :title="isSelf(user) ? 'Anda tidak bisa mengubah akun sendiri' : undefined"
                @change="handleRoleChange(user, $event.target.value, $event.target)"
              >
                <option v-for="r in ROLE_OPTIONS" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
              </select>
            </td>
            <td data-label="Status">
              <span class="pill" :class="user.isActive ? 'on' : 'off'">{{ user.isActive ? "Aktif" : "Nonaktif" }}</span>
            </td>
            <td data-label="Aksi">
              <button
                type="button"
                class="row-btn"
                :class="{ danger: user.isActive }"
                :disabled="isSelf(user) || updatingId !== null"
                :title="isSelf(user) ? 'Anda tidak bisa mengubah akun sendiri' : undefined"
                :aria-label="`${user.isActive ? 'Blokir' : 'Aktifkan'} ${user.name}`"
                @click="toggleUserStatus(user)"
              >
                {{ updatingId === user.id ? "Menyimpan..." : user.isActive ? "Blokir" : "Aktifkan" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.email { word-break: break-all; color: var(--muted); }
.you { margin-left: 8px; font: 600 0.64rem var(--font-body); letter-spacing: 0.1em; text-transform: uppercase; padding: 2px 10px; border-radius: var(--pill); background: var(--peach); color: var(--slate); }
.pill { display: inline-block; padding: 3px 14px; border-radius: var(--pill); font: 600 0.74rem var(--font-body); }
.pill.on { background: var(--ok-bg); color: var(--ok); }
.pill.off { background: var(--danger-bg); color: var(--danger); }
.row-btn { padding: 7px 20px; font: 600 0.78rem var(--font-body); color: var(--slate); background: transparent; border: 1.5px solid var(--slate); border-radius: var(--pill); cursor: pointer; transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease; }
.row-btn:hover:not(:disabled) { background: var(--slate); color: #fff; transform: translateY(-1px); }
.row-btn.danger { color: var(--danger); border-color: rgba(179, 54, 74, 0.55); }
.row-btn.danger:hover:not(:disabled) { background: var(--danger); border-color: var(--danger); color: #fff; }
.row-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
