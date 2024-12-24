<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VolumeMeter from '@/worklet/VolumeMeterProcessor.js?url'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import InputRange from '@/components/ui/InputRange.vue'

const audioContext = new AudioContext()
const mediaStream = ref<MediaStream>(new MediaStream())
const micNode = ref<MediaStreamAudioSourceNode>()
const volumeMeterNode = ref<AudioWorkletNode>()
const meterVal = ref(0)
const isPlaying = ref(false)

onMounted(async () => {
  await audioContext.audioWorklet.addModule(VolumeMeter)
})

const startAudio = async () => {
  // media stream
  mediaStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })

  // mic node.
  micNode.value = audioContext.createMediaStreamSource(mediaStream.value)

  // volume meter node.
  volumeMeterNode.value = new AudioWorkletNode(audioContext, 'volume-meter')
  volumeMeterNode.value.port.onmessage = ({ data }) => {
    meterVal.value = data * 500
  }

  // connect mic ==> volume-meter
  micNode.value?.connect(volumeMeterNode.value)
}

// Stop the audio playback and release the resources.
const stopAudio = () => {
  // remove media stream.
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((track) => track.stop())
  }

  // remove mic node.
  if (micNode.value) {
    micNode.value.disconnect()
  }

  // remove volume meter node.
  if (volumeMeterNode.value) {
    volumeMeterNode.value.disconnect()
  }
}

const changeSwitch = async () => {
  if (!isPlaying.value) {
    isPlaying.value = true

    await startAudio()
    audioContext.resume()
  } else {
    isPlaying.value = false

    audioContext.suspend()
    stopAudio()

    meterVal.value = 0
  }
}
</script>

<template>
  <div class="">
    <div class="">Audio Volume Meter</div>
    <div class="">
      <div class="mb-2 w-1/4 rounded bg-slate-100 p-3 text-sm">
        <InputRange class="" :min="0" :max="100" :step="1" v-model="meterVal" />
        <div class="flex">
          <ToggleSwitch class="me-2" @change="changeSwitch" />
          {{ Math.floor(meterVal * 100) / 100 }}
        </div>
      </div>
    </div>
    <div class=""></div>
  </div>
</template>

<style lang="scss" scoped></style>
