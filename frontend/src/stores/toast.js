import { ref } from "vue";
import { defineStore } from "pinia";
import { errorInfo } from "../api/http";

const MAX_VISIBLE = 4;
let nextId = 1;

export const useToastStore = defineStore("toast", () => {
  const toasts = ref([]);
  const timers = new Map();

  function dismiss(id) {
    clearTimeout(timers.get(id));
    timers.delete(id);
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function push(type, message, ms = 5000) {
    const id = nextId++;
    toasts.value.push({ id, type, message });
    while (toasts.value.length > MAX_VISIBLE) dismiss(toasts.value[0].id);
    if (ms > 0) timers.set(id, setTimeout(() => dismiss(id), ms));
    return id;
  }

  const success = (message, ms) => push("success", message, ms);
  const info = (message, ms) => push("info", message, ms);
  const error = (message, ms = 7000) => push("error", message, ms);

  /** Report a failed API call. A 401 is handled globally (redirect to login), so it is not repeated here. */
  function fail(err, overrides) {
    if (err?.response?.status === 401) return null;
    return error(errorInfo(err, overrides).message);
  }

  return { toasts, push, success, info, error, fail, dismiss };
});
