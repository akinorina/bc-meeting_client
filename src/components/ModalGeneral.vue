<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  isCloseModalBack: { type: Boolean, default: true },
  classBg: { type: String, default: '' },
  classFg: { type: String, default: '' },
  styleBg: { type: String, default: '' },
  styleFg: { type: String, default: '' }
})

const status = ref(false)

const open = () => {
  status.value = true
}
const close = () => {
  status.value = false
}
const closeModalBack = () => {
  if (props.isCloseModalBack) {
    status.value = false
  }
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
        :class="props.classBg"
        style="background-color: rgba(0, 0, 0, 0.75)"
        :style="props.styleBg"
        @click.stop.prevent="closeModalBack"
      >
        <div
          class="rounded-md border"
          :class="props.classFg"
          style="background-color: white"
          :style="props.styleFg"
          @click.stop
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss"></style>
