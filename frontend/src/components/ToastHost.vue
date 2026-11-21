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
.toast-host { position: fixed; right: 20px; bottom: 20px; z-index: 60; display: flex; flex-direction: column; gap: 12px; width: min(390px, calc(100vw - 32px)); pointer-events: none; }
.toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px; border-radius: 22px; border: 1px solid var(--line); background: var(--cream); box-shadow: 0 14px 34px rgba(79, 93, 136, 0.25); font: 500 0.88rem/1.5 var(--font-body); animation: gk-pop 0.25s ease; }
.toast.success { background: #eaf7ef; border-color: rgba(30, 107, 54, 0.3); color: var(--ok); }
.toast.error { background: #fdeaea; border-color: rgba(179, 54, 74, 0.35); color: var(--danger); }
.toast.info { background: #eef2fb; border-color: rgba(51, 80, 138, 0.3); color: var(--info); }
.msg { flex: 1; }
.x { background: none; border: 0; font-size: 1.4rem; line-height: 1; color: inherit; cursor: pointer; padding: 0 2px; opacity: 0.7; }
.x:hover { opacity: 1; }
@keyframes gk-pop { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
</style>
