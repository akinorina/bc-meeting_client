<script setup lang="ts">
export interface Props {
  type?: any
}
const { type = 'button' } = defineProps<Props>()
</script>

<template>
  <button :type="type" class="rounded-md bg-sky-400 px-3 py-1 text-slate-50 hover:bg-sky-500">
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped></style>
