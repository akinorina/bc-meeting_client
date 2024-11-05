<script setup lang="ts">
const model = defineModel({ required: true })

export interface Props {
  placeholder?: string
}
const { placeholder = '' } = defineProps<Props>()
</script>

<template>
  <input type="text" :placeholder="placeholder" class="mx-1 border px-2" v-model="model" />
</template>

<style lang="scss" scoped></style>
