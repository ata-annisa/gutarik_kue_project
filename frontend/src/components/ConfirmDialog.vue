<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useConfirmStore } from "../stores/confirm";

const confirm = useConfirmStore();
const text = ref("");
const touched = ref(false);
const inputEl = ref(null);
const okEl = ref(null);

const d = computed(() => confirm.dialog);
const min = computed(() => d.value?.prompt?.minLength ?? 1);
const promptError = computed(() =>
  d.value?.prompt && touched.value && text.value.trim().length < min.value ? `Minimal ${min.value} karakter.` : ""
);

watch(d, async (now) => {
  text.value = "";
  touched.value = false;
  if (!now) return;
  await nextTick();
  (inputEl.value ?? okEl.value)?.focus();
});

function accept() {
  if (d.value.prompt) {
    touched.value = true;
    if (text.value.trim().length < min.value) return;
    confirm.settle(text.value.trim());
  } else {
    confirm.settle(true);
  }
}
</script>

<template>
  <div v-if="d" class="overlay" @click.self="confirm.cancel()" @keydown.esc="confirm.cancel()">
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg">
      <h2 id="dlg-title">{{ d.title }}</h2>
      <p v-if="d.message" id="dlg-msg" class="msg">{{ d.message }}</p>

      <div v-if="d.prompt" class="field" :class="{ 'has-error': promptError }">
        <label for="dlg-input">{{ d.prompt.label }}</label>
        <textarea
          id="dlg-input"
          ref="inputEl"
          v-model="text"
          rows="3"
          :maxlength="d.prompt.maxLength"
          :placeholder="d.prompt.placeholder"
          @blur="touched = true"
        />
        <p v-if="promptError" class="error-text">{{ promptError }}</p>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost small dlg-cancel" @click="confirm.cancel()">{{ d.cancelText }}</button>
        <button ref="okEl" type="button" class="btn small dlg-confirm" :class="{ danger: d.danger }" @click="accept">
          {{ d.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 16px; background: rgba(79, 93, 136, 0.38); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); animation: gk-fade 0.18s ease; }
.dialog { width: min(460px, 100%); background: var(--cream); border: 1px solid var(--line); border-radius: 30px; padding: 28px 28px 24px; box-shadow: 0 24px 60px rgba(40, 48, 80, 0.35); animation: gk-pop 0.22s ease; }
.dialog h2 { font: 400 1.7rem/1.2 var(--font-display); color: var(--slate); }
.msg { white-space: pre-line; color: var(--text-2); font-size: 0.92rem; }
.actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
@keyframes gk-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes gk-pop { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
</style>
