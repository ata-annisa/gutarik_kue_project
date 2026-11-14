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
.overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 16px; background: rgba(40, 22, 30, 0.45); }
.dialog { width: min(440px, 100%); background: var(--card); border-radius: var(--radius); padding: 22px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3); }
.msg { white-space: pre-line; color: var(--muted); }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px; }
</style>
