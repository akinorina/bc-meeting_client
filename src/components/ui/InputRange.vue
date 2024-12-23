<script setup lang="ts">
import { defineModel } from 'vue';

const model = defineModel()

export interface Props {
  min?: number
  max?: number
  step?: number
}
const { min = 0, max = 100, step = 1 } = defineProps<Props>()

</script>

<template>
  <div class="" style="border: 0px red dashed;">
    <input class="w-full" type="range" :min="min" :max="max" :step="step" v-model="model" />
  </div>
</template>
