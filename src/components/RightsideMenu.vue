<script setup lang="ts">

interface Props {
  selected: '' | 'chat' | 'settings' | 'virtual-background'
}
const {
  selected = 'chat',
} = defineProps<Props>()

const emit = defineEmits([
  'open-chat',
  'open-settings',
  'open-bg'
])
</script>

<template>
  <div class="w-full gap-1 flex my-0 py-0 bg-slate-100 cursor-pointer font-bold text-center text-black border-0 border-slate-100">
    <div
      class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'chat' }"
      @click="emit('open-chat')"
    >
      チャット
    </div>
    <div
      class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'settings' }"
      @click="emit('open-settings')"
    >
      設定
    </div>
    <div
      class="w-1/3 py-2 bg-slate-200 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'virtual-background' }"
      @click="emit('open-bg')"
    >
      背景
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
