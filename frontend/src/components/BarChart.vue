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
figcaption { font: 500 1.05rem var(--serif); margin-bottom: 12px; }
.bars { display: flex; align-items: flex-end; gap: 8px; height: 170px; }
.col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
.bar { width: 100%; max-width: 44px; background: var(--gold); border-radius: 4px 4px 0 0; transition: height 0.3s; }
.val { font-size: 0.7rem; color: var(--muted); white-space: nowrap; }
.lbl { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }
</style>
