<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel({ required: true })

export interface Props {
  placeholder?: string
}
const { placeholder = '' } = defineProps<Props>()

const type = ref('password')
</script>

<template>
  <input
    :type="type"
    :placeholder="placeholder"
    class="border px-2 mx-1"
    v-model="model"
  />
</template>

<style lang="scss" scoped></style>
