<script setup lang="ts">
import { useMediaDeviceStore } from '../stores/mediaDevice'

const emit = defineEmits(['change-video-input', 'change-audio-input'])

const mediaDeviceStore = useMediaDeviceStore()
</script>

<template>
  <div class="w-full">
    <div class="my-5 border px-2 py-3" v-if="mediaDeviceStore.deviceVideoInputs.length > 0">
      <div class="font-bold">映像入力</div>
      <select
        class="mt-3 w-full border p-3"
        v-model="mediaDeviceStore.videoInputDeviceId"
        @change="emit('change-video-input')"
      >
        <template v-for="(val, sKey) in mediaDeviceStore.deviceVideoInputs" :key="sKey">
          <option :value="val.deviceId">
            {{ val.label }}
          </option>
        </template>
      </select>
    </div>

    <div class="my-5 border px-2 py-3" v-if="mediaDeviceStore.deviceAudioInputs.length > 0">
      <div class="font-bold">音声入力</div>
      <select
        class="mt-3 w-full border p-3"
        v-model="mediaDeviceStore.audioInputDeviceId"
        @change="emit('change-audio-input')"
      >
        <template v-for="(val, sKey) in mediaDeviceStore.deviceAudioInputs" :key="sKey">
          <option :value="val.deviceId">
            {{ val.label }}
          </option>
        </template>
      </select>
    </div>
  </div>
</template>
