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
  setTimeout(() => {
    buttonExplaining.value = false
  }, 5000)
}
const hideButtonExplaining = () => {
  buttonExplaining.value = false
}
</script>

<template>
  <button
    :type="type"
    class="relative rounded-md bg-primary-400 px-3 py-1 text-slate-50 hover:bg-primary-500"
    :disabled="disabled"
    @mouseover="showButtonExplaining"
    @mouseout="hideButtonExplaining"
  >
    <slot></slot>
    <div
      class="explanation m-0 bg-slate-50 p-0 text-black"
      :class="{ show: buttonExplaining }"
      v-if="$slots.explain"
    >
      <slot name="explain"></slot>
    </div>
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
