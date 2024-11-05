<script setup lang="ts">
export interface Props {
  type?: any
  disabled?: boolean
}
const { type = 'button', disabled = false } = defineProps<Props>()
</script>

<template>
  <button
    :type="type"
    class="rounded-md bg-primary-400 px-3 py-1 text-slate-50 hover:bg-primary-500"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped></style>
