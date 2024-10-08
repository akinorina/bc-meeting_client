<script setup lang="ts">
const model = defineModel({ required: true })

export interface Props {
  placefolder?: string
}
const { placefolder = '' } = defineProps<Props>()
</script>

<template>
  <input
    type="text"
    :placeholder="placefolder"
    class="mx-1 rounded-sm border px-2"
    v-model="model"
  />
</template>

<style lang="scss" scoped></style>
