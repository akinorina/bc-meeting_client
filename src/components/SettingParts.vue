<script setup lang="ts">
import DeviceSettings from './DeviceSettings.vue';
import ButtonGeneralPrimary from './ui/ButtonGeneralPrimary.vue';
import InputCheckbox from './ui/InputCheckbox.vue';
import InputText from './ui/InputText.vue';

const myVideoMirrored = defineModel('myVideoMirrored')
const myDisplayName = defineModel('myDisplayName')

const emit = defineEmits(['change-display-name', 'change-video-input', 'change-audio-input'])
</script>

<template>
  <div class="p-0 border-0 border-blue-500 border-dashed">
    <div class="mx-0 mb-5 border px-2 py-5">
      <InputCheckbox class="" v-model="myVideoMirrored">
        自身の画像を鏡映反転する
      </InputCheckbox>
    </div>

    <div class="mx-0 my-5 px-0 py-0">
      <DeviceSettings
        @change-video-input="emit('change-video-input')"
        @change-audio-input="emit('change-audio-input')"
      />
    </div>

    <div class="mx-0 my-5 border px-2 py-5">
      <div class="">表示名</div>
      <InputText
        class="me-2 h-10 display-name__text"
        placeholder="表示名"
        v-model="myDisplayName"
      />
      <ButtonGeneralPrimary class="w-18 h-12" @click="emit('change-display-name')">
        変更
      </ButtonGeneralPrimary>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.display-name {
  &__text {
    width: calc(100% - 70px);
  }
}
</style>
