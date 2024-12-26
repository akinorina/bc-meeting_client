<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useMediaDeviceStore } from '@/stores/mediaDevice'
import { useMediaStreamBlurStore } from '@/stores/mediaStreamBlur'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import { RouterLink } from 'vue-router'

const mediaDeviceStore = useMediaDeviceStore()
// const mediaStreamNormalStore = useMediaStreamNormalStore()
const mediaStreamBlurStore = useMediaStreamBlurStore()

// media stream
const mediaStream = ref<MediaStream>(new MediaStream())

// video/audio: on/off
const trackStatus = ref({ video: true, audio: true })

// 鏡映反転 flag
const myVideoMirrored = ref(true)

onMounted(async () => {
  // open MediaStream
  await mediaDeviceStore.init()
  await mediaStreamBlurStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
  mediaStream.value = mediaStreamBlurStore.getMediaStream() as MediaStream
  //
  trackStatus.value = { video: true, audio: true }
})

onBeforeUnmount(() => {
  mediaStreamBlurStore.closeMediaStream()
})

// video on/off
const toggleVideo = async () => {
  trackStatus.value.video = !trackStatus.value.video
  mediaStream.value.getVideoTracks().forEach((track) => {
    track.enabled = trackStatus.value.video
  })
}

// audio on/off
const toggleAudio = () => {
  trackStatus.value.audio = !trackStatus.value.audio
  mediaStream.value.getAudioTracks().forEach((tr) => {
    tr.enabled = trackStatus.value.audio
  })
}

// 鏡像反転 on/off
const toggleMirrored = () => {
  myVideoMirrored.value = !myVideoMirrored.value
}
</script>

<template>
  <div class="h-full w-full bg-slate-100 p-3">
    <div class="flex justify-center">
      <video
        class="max-h-96 max-w-full bg-slate-100"
        :class="{ 'video-mirrored': myVideoMirrored }"
        :srcObject.prop="mediaStream"
        autoplay
        muted
        playsinline
      ></video>
    </div>
    <audio :srcObject.prop="mediaStream" autoplay playsinline></audio>

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- 鏡像反転 on/off -->
        <ButtonGeneralPrimary
          class="me-3 h-12 w-12"
          :class="{
            'bg-slate-400': !trackStatus.audio,
            'hover:bg-slate-500': !trackStatus.audio
          }"
          @click="toggleMirrored"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            class="bi bi-arrow-left-right"
            viewBox="-2 -2 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5m14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5"
            />
          </svg>
        </ButtonGeneralPrimary>
        <!-- // 鏡像反転 on/off -->

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

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <RouterLink :to="{ name: 'samples' }">samples</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.video-mirrored {
  transform: scaleX(-1);
}
</style>
