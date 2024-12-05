<script setup lang="ts">
import { ref } from 'vue'

export interface Props {
  type?: any
}
const { type = 'button' } = defineProps<Props>()

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
    class="relative rounded-md bg-sky-400 px-3 py-1 text-slate-50 hover:bg-sky-500"
    @mouseover="showButtonExplaining"
    @mouseout="hideButtonExplaining"
  >
    <slot></slot>
    <div
      class="explanation p-0 m-0 text-black bg-slate-50"
      :class="{ 'show': buttonExplaining }"
      v-if="$slots.explain"
    >
      <slot name="explain"></slot>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.explanation {
  display: none;
  width: 150%;
  height: 50px;
  border: 1px #000000 solid;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  left: 0;
  top: -55px;
  z-index: 30;
  font-size: 0.75rem;
}
.explanation.show {
  display: block;
}
</style>
