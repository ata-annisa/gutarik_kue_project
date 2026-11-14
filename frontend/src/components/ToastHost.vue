<script setup>
import { useToastStore } from "../stores/toast";

const toast = useToastStore();
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="false">
    <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type" :role="t.type === 'error' ? 'alert' : 'status'">
      <span class="msg">{{ t.message }}</span>
      <button type="button" class="x" aria-label="Tutup notifikasi" @click="toast.dismiss(t.id)">&times;</button>
    </div>
  </div>
</template>

<style scoped>
.toast-host { position: fixed; right: 16px; bottom: 16px; z-index: 60; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--card); box-shadow: 0 6px 22px rgba(74, 44, 58, 0.18); font-size: 0.93rem; }
.toast.success { background: var(--ok-bg); border-color: #b9dfc4; color: var(--ok); }
.toast.error { background: var(--danger-bg); border-color: #f3c1bd; color: var(--danger); }
.toast.info { background: var(--info-bg); border-color: #c4d7ee; color: var(--info); }
.msg { flex: 1; }
.x { background: none; border: 0; font-size: 1.3rem; line-height: 1; color: inherit; cursor: pointer; padding: 0 2px; }
</style>
