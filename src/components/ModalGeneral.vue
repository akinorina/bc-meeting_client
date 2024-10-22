<script setup lang="ts">
import { ref } from 'vue'

export interface Props {
  isCloseModalBack?: Boolean
  classBg?: string
  classFg?: string
  styleBg?: string
  styleFg?: string
  closeModalBackCallback?: Function
}
const {
  isCloseModalBack = true,
  classBg = '',
  classFg = '',
  styleBg = '',
  styleFg = '',
  closeModalBackCallback = (() => { })
} = defineProps<Props>()

const status = ref(false)

const open = () => {
  status.value = true
}
const close = () => {
  status.value = false
}
const closeModalBack = () => {
  if (isCloseModalBack) {
    status.value = false
  }
  closeModalBackCallback()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <Teleport to="body">
    <div v-if="status" class="fixed left-0 top-0 z-[1000]">
      <div
        class="flex h-screen w-screen items-center justify-center"
        :class="classBg"
        style="background-color: rgba(0, 0, 0, 0.75)"
        :style="styleBg"
        @click.stop.prevent="closeModalBack"
      >
        <div
          class="rounded-md border"
          :class="classFg"
          style="background-color: white"
          :style="styleFg"
          @click.stop
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss"></style>
