<script setup lang="ts">
const emit = defineEmits([
  'open-chat',
  'open-settings',
  'open-bg'
])
</script>

<template>
  <div class="w-full gap-1 flex my-0 py-0 bg-slate-100 cursor-pointer font-bold text-center text-black border-0 border-slate-100">
    <div class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50" @click="emit('open-chat')">
      チャット
    </div>
    <div class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50" @click="emit('open-settings')">
      設定
    </div>
    <div class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50" @click="emit('open-bg')">
      背景
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
