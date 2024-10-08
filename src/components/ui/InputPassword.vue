<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel({ required: true })

export interface Props {
  placefolder?: string
}
const { placefolder = '' } = defineProps<Props>()

const type = ref('password')
</script>

<template>
  <input
    :type="type"
    :placeholder="placefolder"
    class="mx-1 rounded-sm border px-2"
    v-model="model"
  />
</template>

<style lang="scss" scoped></style>
