import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authApi } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  // Only the public profile { id, name, email, role } is kept. There is no token here.
  const user = ref(null);
  let bootstrap = null;

  const isAuthenticated = computed(() => user.value !== null);
  const role = computed(() => user.value?.role ?? null);

  /** Ask the server who we are (once per page load). Resolves even when logged out. */
  function init() {
    bootstrap ??= authApi
      .me()
      .then((u) => {
        user.value = u;
      })
      .catch(() => {
        user.value = null;
      });
    return bootstrap;
  }

  async function login(credentials) {
    user.value = await authApi.login(credentials);
    return user.value;
  }

  async function register(data) {
    user.value = await authApi.register(data);
    return user.value;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
    }
  }

  /** Drop local state without calling the server (used when the session already expired). */
  function clear() {
    user.value = null;
  }

  return { user, isAuthenticated, role, init, login, register, logout, clear };
});
