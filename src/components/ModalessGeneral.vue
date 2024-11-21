<script setup lang="ts">
import { ref } from 'vue'

export interface Props {
  posLeft: number,
  posTop: number,
  // isCloseModalBack?: Boolean
  // classBg?: string
  classFg?: string
  // styleBg?: string
  styleFg?: string
  // closeModalBackCallback?: Function
}
const {
  posLeft = 0,
  posTop = 0,
  // isCloseModalBack = true,
  // classBg = '',
  classFg = '',
  // styleBg = '',
  styleFg = '',
  // closeModalBackCallback = () => {}
} = defineProps<Props>()

const status = ref(false)

const open = () => {
  status.value = true
}
const close = () => {
  status.value = false
}

defineExpose({
  open,
  close
})
</script>

<template>
  <Teleport to="body">
    <div v-if="status" class="fixed z-[1000]" :style="'top: ' + posTop + 'px; left:' + posLeft + 'px;' ">
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
  </Teleport>
</template>

<style scoped lang="scss"></style>
