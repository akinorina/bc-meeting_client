<script setup lang="ts">
import ButtonGeneralDanger from './ui/ButtonGeneralDanger.vue'
import ButtonGeneralPrimary from './ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from './ui/ButtonGeneralSecondary.vue'

interface Props {
  viewMode: 'speaker' | 'matrix'
  trackStatusVideo: boolean
  trackStatusAudio: boolean
}
const {
  viewMode = 'speaker',
  trackStatusVideo = true,
  trackStatusAudio = true
} = defineProps<Props>()

const emit = defineEmits([
  'change-view-mode',
  'toggle-video',
  'toggle-audio',
  'exit-room',
  'open-settings'
])
</script>

<template>
  <div class="w-full bg-slate-50">
    <div class="flex h-16 w-full items-center justify-center bg-slate-500 sm:hidden">
      <!-- change View mode -->
      <ButtonGeneralPrimary class="m-0 me-2 h-12 w-12 p-0" @click="emit('change-view-mode')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-person-fill"
          viewBox="0 0 16 16"
          v-if="viewMode === 'speaker'"
        >
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-grid-3x3"
          viewBox="0 0 16 16"
          v-if="viewMode === 'matrix'"
        >
          <path
            d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z"
          />
        </svg>
        <template #explain>ビューモード変更</template>
      </ButtonGeneralPrimary>
      <!-- // change View mode -->

      <!-- toggle Video -->
      <ButtonGeneralPrimary
        class="m-0 me-2 h-12 w-12 p-0"
        :class="{
          'bg-slate-400': !trackStatusVideo,
          'hover:bg-slate-500': !trackStatusVideo
        }"
        @click="emit('toggle-video')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="24"
          fill="currentColor"
          class="bi bi-camera-video-fill"
          viewBox="0 0 20 20"
          v-if="trackStatusVideo"
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
        <template #explain>カメラ ON/OFF</template>
      </ButtonGeneralPrimary>
      <!-- // toggle Video -->

      <!-- toggle Audio -->
      <ButtonGeneralPrimary
        class="m-0 me-2 h-12 w-12 p-0"
        :class="{
          'bg-slate-400': !trackStatusAudio,
          'hover:bg-slate-500': !trackStatusAudio
        }"
        @click="emit('toggle-audio')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="24"
          fill="currentColor"
          class="bi bi-mic-fill"
          viewBox="0 0 20 20"
          v-if="trackStatusAudio"
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
        <template #explain>マイク ON/OFF</template>
      </ButtonGeneralPrimary>
      <!-- // toggle Audio -->

      <!-- 設定 -->
      <ButtonGeneralPrimary class="w-18 m-0 me-2 h-12 p-0" @click="emit('open-settings')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-three-dots-vertical"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
          />
        </svg>
        <template #explain>チャット、設定、背景</template>
      </ButtonGeneralPrimary>
      <!-- // 設定 -->

      <!-- 退室 -->
      <ButtonGeneralDanger
        class="w-18 m-0 me-2 h-12 p-0"
        @click="emit('exit-room')"
      >
        <template #default>
        退室
        </template>
        <template #explain>退室します</template>
      </ButtonGeneralDanger>
      <!-- // 退室 -->
    </div>

    <div class="hidden h-16 w-full bg-slate-500 sm:flex sm:items-center sm:justify-center">
      <!-- change View mode -->
      <ButtonGeneralPrimary class="me-2 h-12 w-12" @click="emit('change-view-mode')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-person-fill"
          viewBox="0 0 16 16"
          v-if="viewMode === 'speaker'"
        >
          <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-grid-3x3"
          viewBox="0 0 16 16"
          v-if="viewMode === 'matrix'"
        >
          <path
            d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z"
          />
        </svg>
        <template #explain>ビューモード切り替え</template>
      </ButtonGeneralPrimary>
      <!-- // change View mode -->

      <!-- toggle Video -->
      <ButtonGeneralPrimary
        class="me-2 h-12 w-12"
        :class="{
          'bg-slate-400': !trackStatusVideo,
          'hover:bg-slate-500': !trackStatusVideo
        }"
        @click="emit('toggle-video')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="24"
          fill="currentColor"
          class="bi bi-camera-video-fill"
          viewBox="0 0 20 20"
          v-if="trackStatusVideo"
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
        <template #explain>カメラ ON/OFF</template>
      </ButtonGeneralPrimary>
      <!-- // toggle Video -->

      <!-- toggle Audio -->
      <ButtonGeneralPrimary
        class="me-2 h-12 w-12"
        :class="{
          'bg-slate-400': !trackStatusAudio,
          'hover:bg-slate-500': !trackStatusAudio
        }"
        @click="emit('toggle-audio')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="24"
          fill="currentColor"
          class="bi bi-mic-fill"
          viewBox="0 0 20 20"
          v-if="trackStatusAudio"
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
        <template #explain>マイク ON/OFF</template>
      </ButtonGeneralPrimary>
      <!-- // toggle Audio -->

      <!-- 設定 -->
      <ButtonGeneralSecondary class="me-2 h-12 w-12" @click="emit('open-settings')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="currentColor"
          class="bi bi-three-dots-vertical"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
          />
        </svg>
        <template #explain>各種の設定</template>
      </ButtonGeneralSecondary>
      <!-- // 設定 -->

      <!-- 退室 -->
      <ButtonGeneralDanger class="me-2 h-12 w-16" @click="emit('exit-room')">
        退室
        <template #explain>ミーティングから退室します。</template>
      </ButtonGeneralDanger>
      <!-- // 退室 -->
    </div>
  </div>
</template>
