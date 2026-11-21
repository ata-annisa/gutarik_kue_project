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
.stat { position: relative; background: var(--cream); border: 1px solid var(--line); border-radius: 24px; padding: 18px 20px 18px; box-shadow: var(--shadow); overflow: hidden; transition: transform 0.22s ease, box-shadow 0.22s ease; }
.stat::after { content: ""; position: absolute; right: -18px; top: -18px; width: 64px; height: 64px; border-radius: 50%; background: var(--peach); opacity: 0.8; }
.stat:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
.stat.warn { background: var(--warn-bg); border-color: rgba(122, 82, 0, 0.28); }
.stat.warn::after { background: #ffe2a3; }
.stat.ok::after { background: var(--ok-bg); }
.label { position: relative; z-index: 1; margin: 0; font: 600 0.68rem var(--font-body); text-transform: uppercase; letter-spacing: 0.18em; color: var(--slate); }
.value { position: relative; z-index: 1; margin: 6px 0 0; font: 700 1.65rem/1.2 var(--font-brand); color: var(--slate); word-break: break-word; }
.hint { position: relative; z-index: 1; margin: 3px 0 0; font-size: 0.78rem; }
</style>
