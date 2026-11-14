import { ref } from "vue";
import { defineStore } from "pinia";

// Promise based dialogs, rendered once by <ConfirmDialog /> in App.vue:
//   if (await confirm.ask({ title, message, danger: true })) { ... }
//   const reason = await confirm.prompt({ title, prompt: { label, minLength: 3 } })   // string, or null if cancelled
export const useConfirmStore = defineStore("confirm", () => {
  const dialog = ref(null);

  function open(options, cancelValue) {
    return new Promise((resolve) => {
      if (dialog.value) dialog.value.resolve(dialog.value.cancelValue); // a newer dialog replaces an open one
      dialog.value = { ...options, cancelValue, resolve };
    });
  }

  const ask = (options) => open({ confirmText: "Ya, lanjutkan", cancelText: "Batal", ...options, prompt: null }, false);
  const prompt = (options) =>
    open({ confirmText: "Kirim", cancelText: "Batal", ...options, prompt: { ...options.prompt } }, null);

  function settle(value) {
    const d = dialog.value;
    dialog.value = null;
    d?.resolve(value);
  }
  const cancel = () => settle(dialog.value?.cancelValue ?? false);

  return { dialog, ask, prompt, settle, cancel };
});
