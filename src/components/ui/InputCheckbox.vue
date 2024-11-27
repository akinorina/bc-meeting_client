<script setup lang="ts">
const model = defineModel()
</script>

<template>
  <div class="w-full text-center">
    <div class="flex items-center">
      <input id="check" type="checkbox" class="cb me-1" v-model="model" />
      <label for="check"><slot></slot></label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cb {
  width: 1.2rem;
  height: 1.2rem;
}
</style>
