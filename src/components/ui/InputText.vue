<script setup lang="ts">
const model = defineModel({ required: true })

export interface Props {
  placeholder?: string
}
const { placeholder = '' } = defineProps<Props>()
</script>

<template>
  <input
    type="text"
    :placeholder="placeholder"
    class="border px-2 mx-1"
    v-model="model"
  />
</template>

<style lang="scss" scoped></style>
