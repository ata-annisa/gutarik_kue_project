<script setup>
import { computed, ref, useId } from "vue";

const model = defineModel({ type: [String, Number], default: "" });
const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  autocomplete: { type: String, default: "off" },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
  maxlength: { type: Number, default: undefined },
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 3 },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined },
  placeholder: { type: String, default: undefined },
  list: { type: String, default: undefined },
});

const id = useId();
const revealed = ref(false);
const isPassword = computed(() => props.type === "password");
const inputType = computed(() => (isPassword.value && revealed.value ? "text" : props.type));
const describedBy = computed(() => (props.error ? `${id}-err` : props.hint ? `${id}-hint` : undefined));
</script>

<template>
  <div class="field" :class="{ 'has-error': error }">
    <label :for="id">{{ label }}</label>
    <div class="control">
      <textarea
        v-if="multiline"
        :id="id"
        v-model="model"
        :rows="rows"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="describedBy"
      />
      <input
        v-else
        :id="id"
        v-model="model"
        :type="inputType"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :min="min"
        :max="max"
        :step="step"
        :placeholder="placeholder"
        :list="list"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="describedBy"
        spellcheck="false"
      />
      <button v-if="isPassword" type="button" class="reveal" :aria-pressed="revealed" @click="revealed = !revealed">
        {{ revealed ? "Sembunyikan" : "Tampilkan" }}
      </button>
    </div>
    <p v-if="error" :id="`${id}-err`" class="error-text">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="hint">{{ hint }}</p>
  </div>
</template>
