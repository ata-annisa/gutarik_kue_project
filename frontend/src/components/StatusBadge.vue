<script setup>
import { computed } from "vue";
import { ORDER_STATUS_LABEL, PRODUCT_STATUS_LABEL } from "../utils/labels";

const props = defineProps({
  kind: { type: String, default: "order" }, // "order" | "product"
  status: { type: String, required: true },
});
const label = computed(() => (props.kind === "product" ? PRODUCT_STATUS_LABEL : ORDER_STATUS_LABEL)[props.status] ?? props.status);
</script>

<template>
  <span class="status-badge" :data-kind="kind" :data-status="status">{{ label }}</span>
</template>

<style scoped>
.status-badge { display: inline-block; padding: 3px 14px; border-radius: var(--pill); font: 600 0.72rem var(--font-body); letter-spacing: 0.03em; background: var(--peach); color: var(--text); white-space: nowrap; }
[data-status="PENDING"] { background: var(--warn-bg); color: var(--warn); }
[data-status="PROCESSING"] { background: var(--info-bg); color: var(--info); }
[data-status="SHIPPED"] { background: #ece6fa; color: #4b3a8a; }
[data-status="DELIVERED"], [data-status="APPROVED"] { background: var(--ok-bg); color: var(--ok); }
[data-status="REJECTED"] { background: var(--danger-bg); color: var(--danger); }
</style>
