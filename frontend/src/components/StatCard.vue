<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: "" },
  tone: { type: String, default: "" }, // "" | "warn" | "ok"
});
</script>

<template>
  <div class="stat" :class="tone">
    <p class="label">{{ label }}</p>
    <p class="value">{{ value }}</p>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.stat { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; }
.stat.warn { border-color: #f0dba0; background: var(--warn-bg); }
.stat.ok { border-color: #b9dfc4; }
.label { margin: 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.value { margin: 4px 0 0; font: 500 1.6rem var(--serif); word-break: break-word; }
.hint { margin: 2px 0 0; }
</style>
