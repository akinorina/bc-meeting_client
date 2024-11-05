<script setup lang="ts">
const model = defineModel({ required: true })

export interface Props {
  placeholder?: any
}
const { placeholder = '' } = defineProps<Props>()
</script>

<template>
  <input type="email" :placeholder="placeholder" class="mx-1 border px-2" v-model="model" />
</template>

<style lang="scss" scoped></style>
