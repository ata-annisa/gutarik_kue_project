<script setup>
defineProps({ meta: { type: Object, required: true } }); // { page, totalPages, total }
const emit = defineEmits(["change"]);
</script>

<template>
  <nav v-if="meta.totalPages > 1" class="pager" aria-label="Halaman">
    <button type="button" class="btn ghost small" :disabled="meta.page <= 1" @click="emit('change', meta.page - 1)">
      &larr; Sebelumnya
    </button>
    <span class="info">Halaman {{ meta.page }} dari {{ meta.totalPages }} ({{ meta.total }} data)</span>
    <button type="button" class="btn ghost small" :disabled="meta.page >= meta.totalPages" @click="emit('change', meta.page + 1)">
      Berikutnya &rarr;
    </button>
  </nav>
</template>

<style scoped>
.pager { display: flex; justify-content: center; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 22px; }
.info { font-size: 0.85rem; color: var(--muted); }
</style>
