<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMediaDeviceStore } from '@/stores/mediaDevice';
import { useMediaStreamStore } from '@/stores/mediaStream';
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ModalGeneral from '@/components/ModalGeneral.vue'
import InputCheckbox from '@/components/ui/InputCheckbox.vue'
import InputText from '@/components/ui/InputText.vue';
import { RouterLink } from 'vue-router';

const mediaDeviceStore = useMediaDeviceStore()
const mediaStreamStore = useMediaStreamStore()

// media stream
const mediaStream = ref<MediaStream>(new MediaStream)

// video/audio: on/off
const trackStatus = ref({ video: true, audio: true })

// 鏡映反転 flag
const myVideoMirrored = ref(true)

// altText
const altText = ref('')
watch(altText, () => {
  console.log('--- watch() - altText ---', altText.value)
  mediaStreamStore.altText = altText.value
  console.log('---> ', mediaStreamStore.altText)
})

// バーチャル背景 設定
// const myBackgroundImage = ref('')

// 設定ダイアログ
const modalSettings = ref()

// バーチャル背景 mediaStream 設定
// video mode
const videoMode = ref('normal:0')
const videoModeTmp = ref('normal:0')
const videoModes = ref({
  'normal:0': '通常',
  'blur:10': 'ぼかし10',
  'blur:30': 'ぼかし30',
  'image:/bgimage1.jpg': '壁紙１',
  'image:/bgimage2.jpg': '壁紙２',
})

onMounted(async () => {
  // canvas text
  altText.value = 'your name.'

  // open the mediastream
  await mediaDeviceStore.init()
  await mediaStreamStore.openNormal(mediaDeviceStore.mediaStreamConstraints)
  mediaStreamStore.openAltText()
  await mediaStreamStore.openVirtualBackground(mediaDeviceStore.mediaStreamConstraints)

  mediaStream.value = mediaStreamStore.mediaStreamNormal?.clone() as MediaStream
  trackStatus.value = { video: true, audio: true }
})

onBeforeUnmount(async () => {
  await mediaStreamStore.closeVirtualBackground()
  mediaStreamStore.closeAltText()
  await mediaStreamStore.closeNormal()

  // close the mediaStream
  mediaStream.value.getTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })
})

/*
// // MediaStream開く
// const openMediaStreams = async () => {
//   switch (videoMode.value) {
//     case 'normal':
//       await mediaStreamStore.openNormal(mediaDeviceStore.mediaStreamConstraints)
//       break
//     case 'alt-text':
//       await mediaStreamStore.openAltText()
//       break
//     default:
//       mediaStreamStore.bgImageUrl = videoMode.value
//       await mediaStreamStore.openVirtualBackground(mediaDeviceStore.mediaStreamConstraints)
//       break
//   }
// }
// // MediaStream閉じる
// const closeMediaStreams = async () => {
//   switch (videoMode.value) {
//     case 'normal':
//       await mediaStreamStore.closeNormal()
//       break
//     case 'alt-text':
//       await mediaStreamStore.closeAltText()
//       break
//     default:
//       await mediaStreamStore.closeVirtualBackground()
//       break
//   }
// }
*/

// video on/off
const toggleVideo = async () => {
  trackStatus.value.video = !trackStatus.value.video
  if (trackStatus.value.video) {
    // altText -> normal or ...
    videoMode.value = videoModeTmp.value
  } else {
    // normal or ... -> altText
    videoModeTmp.value = videoMode.value
    videoMode.value = 'alt-text'
  }

  // 既存mediaStream から Video を入れ替え
  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })
  switch (videoMode.value) {
    case 'normal':
      mediaStreamStore.mediaStreamNormal?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    case 'alt-text':
      mediaStreamStore.mediaStreamAltText?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    default:
      mediaStreamStore.mediaStreamVbg?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
  }
}

// audio on/off
const toggleAudio = () => {
  trackStatus.value.audio = !trackStatus.value.audio
  mediaStream.value.getAudioTracks().forEach((tr: MediaStreamTrack) => {
    tr.enabled = trackStatus.value.audio
  })
}

// open setting dialog
const openSettings = () => {
  // device list
  mediaDeviceStore.makeDeviceList()
  // open modal
  modalSettings.value.open()
}
// デバイス変更 - Video
const changeVideoInput = async () => {
  // close the video mediastream
  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  // device 切替 - Video Input
  mediaDeviceStore.mediaStreamConstraints.video.deviceId = mediaDeviceStore.videoInputDeviceId

  // mediastream 再起動
  await mediaStreamStore.closeNormal()
  mediaStreamStore.closeAltText()
  await mediaStreamStore.closeVirtualBackground()
  await mediaStreamStore.openNormal(mediaDeviceStore.mediaStreamConstraints)
  mediaStreamStore.openAltText()
  await mediaStreamStore.openVirtualBackground(mediaDeviceStore.mediaStreamConstraints)

  // 切り替えたMediaStreamからVideoトラックを追加
  switch (videoMode.value) {
    case 'normal':
      mediaStreamStore.mediaStreamNormal?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    case 'alt-text':
      mediaStreamStore.mediaStreamAltText?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    default:
      mediaStreamStore.mediaStreamVbg?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
  }
}
// デバイス変更 - Audio
const changeAudioInput = async () => {
  // close the video mediastream
  mediaStream.value.getAudioTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  // device 切替 - Audio Input
  mediaDeviceStore.mediaStreamConstraints.audio.deviceId = mediaDeviceStore.audioInputDeviceId

  // mediastream 再起動
  await mediaStreamStore.closeNormal()
  await mediaStreamStore.openNormal(mediaDeviceStore.mediaStreamConstraints)

  // Normal の Audio を接続
  mediaStreamStore.mediaStreamNormal?.getAudioTracks().forEach((tr) => {
    mediaStream.value.addTrack(tr.clone())
  })
}

// バーチャル背景 mediaStream 切替
const changeBackground = async () => {
  trackStatus.value.video = true

  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  const selected = videoMode.value.match(/(.+):(.+)/)
  switch (selected[1]) {
    case 'normal':
      // Normal のVideoトラックを mediaStream に追加
      mediaStreamStore.mediaStreamNormal?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    case 'alt-text':
      // AltText のVideoトラックを mediaStream に追加
      mediaStreamStore.mediaStreamAltText?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
    case 'blur':
    case 'image':
      // VirtualBackground パラメータ設定
      mediaStreamStore.virtualMode = selected[1]
      mediaStreamStore.backgroundBlur = parseInt(selected[2])
      mediaStreamStore.bgImageUrl = selected[2]

      // VirtualBackground 再起動
      mediaStreamStore.closeVirtualBackground()
      await mediaStreamStore.openVirtualBackground(mediaDeviceStore.mediaStreamConstraints)

      // VirtualBackground のVideoトラックを mediaStream に追加
      mediaStreamStore.mediaStreamVbg?.getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr.clone())
      })
      break
  }
}
</script>

<template>
  <div class="h-full w-full bg-slate-100 p-3">
    <div class="flex justify-center">
      <video
        class="max-h-96 max-w-full bg-slate-100"
        :class="{ 'video-mirrored': myVideoMirrored && trackStatus.video }"
        :srcObject.prop="mediaStream"
        autoplay
        muted
        playsinline
      ></video>
    </div>
    <audio :srcObject.prop="mediaStream" autoplay playsinline></audio>

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
    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <InputText class="w-80 p-3" v-model="altText" placeholder="your name" />
      </div>
    </div>
    <!-- // mediastream alternative video text-->

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- setings -->
        <ButtonGeneralPrimary class="w-24" @click="openSettings"> 設定 </ButtonGeneralPrimary>
        <!-- // setings -->
      </div>
    </div>

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- select a virtual background. -->
        <div class="">
          <select
            class="mt-3 w-64 border p-3"
            v-model="videoMode"
            @change="changeBackground"
          >
            <template v-for="(val, sKey) in videoModes" :key="sKey">
              <option :value="sKey">
                {{ val }}
              </option>
            </template>
          </select>
          <div class="w-64 h-12 px-3 py-2 border">
            {{ videoMode }}
          </div>
        </div>
        <!-- // select a virtual background. -->
      </div>
    </div>

    <div class="mx-auto">
      <div class="my-3 flex items-center justify-center">
        <!-- go top page. -->
        <RouterLink :to="{ name: 'samples' }">samples</RouterLink>
        <!-- // go top page. -->
      </div>
    </div>
  </div>

  <ModalGeneral ref="modalSettings">
    <div class="p-5">
      <div class="text-center font-bold">設定</div>

      <div class="my-5 w-96 border px-2 py-5">
        <InputCheckbox class="" v-model="myVideoMirrored">自身の画像を鏡映反転する</InputCheckbox>
      </div>

      <div class="my-5 w-96 border px-2 py-3" v-if="mediaDeviceStore.deviceVideoInputs.length > 0">
        <div class="font-bold">映像入力</div>
        <select
          class="mt-3 w-full border p-3"
          v-model="mediaDeviceStore.videoInputDeviceId"
          @change="changeVideoInput"
        >
          <template v-for="(val, sKey) in mediaDeviceStore.deviceVideoInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="my-5 w-96 border px-2 py-3" v-if="mediaDeviceStore.deviceAudioInputs.length > 0">
        <div class="font-bold">音声入力</div>
        <select
          class="mt-3 w-full border p-3"
          v-model="mediaDeviceStore.audioInputDeviceId"
          @change="changeAudioInput"
        >
          <template v-for="(val, sKey) in mediaDeviceStore.deviceAudioInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="">
        <ButtonGeneralPrimary class="" @click="modalSettings.close()"> close </ButtonGeneralPrimary>
      </div>
    </div>
  </ModalGeneral>
</template>

<style scoped lang="scss">
.video-mirrored {
  transform: scaleX(-1);
}
</style>
