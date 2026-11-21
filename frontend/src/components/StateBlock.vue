<script setup>
// Wraps a list or a block of content and takes care of the three "not ready" situations.
defineProps({
  loading: Boolean,
  error: { type: String, default: "" },
  empty: Boolean,
  emptyText: { type: String, default: "Belum ada data." },
});
const emit = defineEmits(["retry"]);
</script>

<template>
  <div v-if="error" class="state-block" role="alert">
    <p class="error-text">{{ error }}</p>
    <button type="button" class="btn small" @click="emit('retry')">Coba lagi</button>
  </div>
  <p v-else-if="loading && empty" class="state-block muted">Memuat...</p>
  <div v-else-if="empty" class="state-block muted">
    <slot name="empty"><p>{{ emptyText }}</p></slot>
  </div>
  <div v-else :class="{ busy: loading }"><slot /></div>
</template>

<style scoped>
.state-block { padding: 44px 16px; text-align: center; margin: 0; }
.state-block.muted { color: var(--muted); }
.busy { opacity: 0.6; transition: opacity 0.15s; }
</style>
