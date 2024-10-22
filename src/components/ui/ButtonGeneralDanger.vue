<script setup lang="ts">
export interface Props {
  type?: any
}
const { type = 'button' } = defineProps<Props>()
</script>

<template>
  <button
    :type="type"
    class="rounded-md bg-danger-400 hover:bg-danger-500 px-3 py-1 text-slate-50"
  >
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped></style>
