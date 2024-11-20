<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useMediaStore } from '@/stores/media'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ModalGeneral from '@/components/ModalGeneral.vue';
import InputCheckbox from '@/components/ui/InputCheckbox.vue';

const mediaStore = useMediaStore()

// video/audio: on/off
const trackStatus = ref({ video: true, audio: true })

// 設定ダイアログ
const modalSettings = ref()

// 鏡映反転 flag
const myVideoMirrored = ref(true)

onMounted(async () => {
  // open the mediastream
  await mediaStore.openMediaStreamLocal()
  mediaStore.mediaStream = mediaStore.mediaStreamLocal
})

onBeforeUnmount(async () => {
  // close the mediastream
  mediaStore.closeMediaStreamLocal()
})

// video on/off
const toggleVideo = () => {
  mediaStore.setVideoEnabled(!trackStatus.value.video)
  trackStatus.value.video = !trackStatus.value.video
}

// audio on/off
const toggleAudio = () => {
  mediaStore.setAudioEnabled(!trackStatus.value.audio)
  trackStatus.value.audio = !trackStatus.value.audio
}

// open setting dialog
const openSettings = () => {
  // device list
  mediaStore.makeDeviceList()
  // open modal
  modalSettings.value.open()
}
</script>

<template>
  <div class="h-full w-full bg-slate-100 p-3">
    <div class="flex justify-center">
      <video
        class="max-w-full max-h-96 bg-slate-100"
        :class="{ 'video-mirrored': myVideoMirrored }"
        :srcObject.prop="mediaStore.mediaStream"
        autoplay
        muted
        playsinline
      ></video>
    </div>
    <!-- <audio :srcObject.prop="mediaStore.mediaStream" autoplay></audio> -->

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- video on/off -->
        <ButtonGeneralPrimary
          class="me-3 h-12 w-12"
          :class="{
            'bg-slate-400': !trackStatus.video,
            'hover:bg-slate-500': !trackStatus.video
          }"
          @click="toggleVideo"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="24"
            fill="currentColor"
            class="bi bi-camera-video-fill"
            viewBox="0 0 20 20"
            v-if="trackStatus.video"
          >
            <path
              fill-rule="evenodd"
              d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="24"
            fill="currentColor"
            class="bi bi-camera-video-off-fill"
            viewBox="0 0 20 20"
            v-else
          >
            <path
              fill-rule="evenodd"
              d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925-10-14 .814-.58 10 14-.814.58z"
            />
          </svg>
        </ButtonGeneralPrimary>
        <!-- // video on/off -->

        <!-- mic on/off -->
        <ButtonGeneralPrimary
          class="me-3 h-12 w-12"
          :class="{
            'bg-slate-400': !trackStatus.audio,
            'hover:bg-slate-500': !trackStatus.audio
          }"
          @click="toggleAudio"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="24"
            fill="currentColor"
            class="bi bi-mic-fill"
            viewBox="0 0 20 20"
            v-if="trackStatus.audio"
          >
            <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z" />
            <path
              d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="24"
            fill="currentColor"
            class="bi bi-mic-mute-fill"
            viewBox="0 0 20 20"
            v-else
          >
            <path
              d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"
            />
            <path
              d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"
            />
          </svg>
        </ButtonGeneralPrimary>
        <!-- // mic on/off -->
      </div>
    </div>

    <!-- mediastream alternative video text -->
    <!--
    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <InputText class="w-80 p-3" v-model="mediaStore.alternativeText" />
      </div>
    </div>
    -->
    <!-- // mediastream alternative video text-->

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- setings -->
        <ButtonGeneralPrimary
          class="w-24"
          @click="openSettings"
        >
          設定
        </ButtonGeneralPrimary>
        <!-- // setings -->
      </div>
    </div>
  </div>

  <ModalGeneral ref="modalSettings">
    <div class="p-5">
      <div class="text-center font-bold">
        設定
      </div>
      
      <div class="w-96 px-2 py-5 my-5 border">
        <InputCheckbox class="" v-model="myVideoMirrored">自身の画像を鏡映反転する</InputCheckbox>
      </div>

      <div class="w-96 px-2 py-3 my-5 border" v-if="mediaStore.deviceVideoInputs.length > 0">
        <div class="font-bold">映像入力</div>
        <select class="w-full p-3 mt-3 border" v-model="mediaStore.videoInputDeviceId" @change="mediaStore.changeVideoInput">
          <template v-for="(val, sKey) in mediaStore.deviceVideoInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="w-96 px-2 py-3 my-5 border" v-if="mediaStore.deviceAudioInputs.length > 0">
        <div class="font-bold">音声入力</div>
        <select class="w-full p-3 mt-3 border" v-model="mediaStore.audioInputDeviceId" @change="mediaStore.changeAudioInput">
          <template v-for="(val, sKey) in mediaStore.deviceAudioInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="">
        <ButtonGeneralPrimary
          class=""
          @click="modalSettings.close()"
        >
          close
        </ButtonGeneralPrimary>
      </div>
    </div>
  </ModalGeneral>
</template>

<style scoped lang="scss">
.video-mirrored {
  transform:scaleX(-1);
}
</style>
