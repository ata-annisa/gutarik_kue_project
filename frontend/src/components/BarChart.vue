<script setup>
import { computed } from "vue";

// A dependency-free bar chart. items: [{ label, value, text? }]  (text is what is printed above the bar)
const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
});
const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)));
</script>

<template>
  <figure class="chart">
    <figcaption>{{ title }}</figcaption>
    <div class="bars" aria-hidden="true">
      <div v-for="i in items" :key="i.label" class="col">
        <span class="val">{{ i.text ?? i.value }}</span>
        <div class="bar" :style="{ height: `${Math.max((i.value / max) * 100, i.value > 0 ? 4 : 0)}%` }" />
        <span class="lbl">{{ i.label }}</span>
      </div>
    </div>
    <table class="sr-only">
      <caption>{{ title }}</caption>
      <tbody>
        <tr v-for="i in items" :key="i.label"><th scope="row">{{ i.label }}</th><td>{{ i.text ?? i.value }}</td></tr>
      </tbody>
    </table>
  </figure>
</template>

<style scoped>
.chart { margin: 0; }
figcaption { font: 600 1.02rem var(--font-body); color: var(--slate); margin-bottom: 16px; }
.bars { display: flex; align-items: flex-end; gap: 10px; height: 180px; padding-top: 6px; border-bottom: 1.5px solid rgba(79, 93, 136, 0.25); }
.col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 5px; }
.bar { width: 100%; max-width: 42px; background: linear-gradient(180deg, var(--coral), #f0a19b); border-radius: 10px 10px 2px 2px; transition: height 0.4s ease, filter 0.2s ease; }
.col:hover .bar { filter: brightness(1.06) saturate(1.1); }
.val { font: 600 0.68rem var(--font-body); color: var(--slate); white-space: nowrap; }
.lbl { font: 500 0.68rem var(--font-body); color: var(--muted); white-space: nowrap; padding-top: 6px; }
</style>
