<script setup lang="ts">
const model = defineModel()
</script>

<template>
  <label class="">
    <input
      v-model="model"
      type="checkbox"
      class="peer sr-only"
    />

    <span
      class="block w-[2em] cursor-pointer bg-gray-500 rounded-full
        p-[1px] after:block after:h-[1em] after:w-[1em] after:rounded-full
        after:bg-white after:transition peer-checked:bg-blue-500
        peer-checked:after:translate-x-[calc(100%-2px)]"
    >
    </span>
  </label>
</template>

<style lang="scss" scoped></style>
