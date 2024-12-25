<script setup lang="ts">
interface Props {
  selected: '' | 'chat' | 'settings' | 'virtual-background'
}
const { selected = 'chat' } = defineProps<Props>()

const emit = defineEmits(['open-chat', 'open-settings', 'open-bg'])
</script>

<template>
  <div
    class="my-0 flex w-full cursor-pointer gap-1 bg-slate-100 py-0 text-center font-bold text-black"
  >
    <div
      class="w-1/3 bg-slate-200 py-2 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'chat' }"
      @click="emit('open-chat')"
    >
      チャット
    </div>
    <div
      class="w-1/3 bg-slate-200 py-2 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'settings' }"
      @click="emit('open-settings')"
    >
      設定
    </div>
    <div
      class="w-1/3 bg-slate-200 py-2 hover:bg-slate-50"
      :class="{ 'bg-slate-50': selected === 'virtual-background' }"
      @click="emit('open-bg')"
    >
      背景
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
