<script setup lang="ts">
import { ref } from 'vue'

export interface Props {
  type?: any
  disabled?: boolean
}
const { type = 'button', disabled = false } = defineProps<Props>()

const buttonExplaining = ref(false)
const showButtonExplaining = () => {
  buttonExplaining.value = true
}
const hideButtonExplaining = () => {
  buttonExplaining.value = false
}
</script>

<template>
  <button
    :type="type"
    class="relative rounded-md bg-danger-400 px-3 py-1 text-slate-50 hover:bg-danger-500"
    :disabled="disabled"
    @mouseover="showButtonExplaining"
    @mouseout="hideButtonExplaining"
  >
    <slot></slot>
    <div
      class="explanation p-0 m-0 text-black bg-slate-50"
      :class="{ 'show': buttonExplaining }"
    >
      <slot name="explain"></slot>
    </div>
      <!-- v-if="$slots.explain" -->
  </button>
</template>

<style lang="scss" scoped>
.explanation {
  display: none;
  width: 100%;
  height: 40px;
  border: 1px #000000 solid;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  left: 0;
  top: -45px;
  z-index: 30;
  font-size: 0.5rem;
}
.explanation.show {
  display: block;
}
</style>
