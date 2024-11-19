<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWebrtcStore } from '@/stores/webrtc'
import { useMediaStore } from '@/stores/media'
import { useRoomStore } from '@/stores/rooms'
import { axios } from '@/lib/Axios'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import ButtonGeneralDanger from '@/components/ui/ButtonGeneralDanger.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import ModalGeneral from '@/components/ModalGeneral.vue'
import VccHeader from '@/components/VccHeader.vue'
import InputCheckbox from '@/components/ui/InputCheckbox.vue'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const webrtcStore = useWebrtcStore()
const mediaStore = useMediaStore()
const roomStore = useRoomStore()

const roomHashParam = computed({
  get() {
    return route.params.room_hash.toString() ?? ''
  },
  set(roomHashParam) {
    router.replace({ params: { room_hash: roomHashParam } })
  }
})
const roomHash = ref(roomHashParam.value)

// my MediaStream video/audio
const trackStatus = ref({ video: true, audio: true })

// view mode (speaker|matrix)
const viewMode = ref('speaker')

// 自身画像の鏡像（左右）反転 on/off
const myVideoMirrored = ref(true)

// my display name
const myDisplayName = ref('')

// 招待メール送信先メールアドレス
const invitedEmailAddress = ref<string>('')

// 状態: 入室 / 退室
const statusEnterRoom = ref(false)

// Speaker View - 現在のスピーカーの Peer ID.
const targetSpeakerPeerId = ref('')

// check interval ID.
let cIId: any = null

// NotFound (== bad room hash)
const isBadRoomHash = ref<boolean>(false)

// Modal: 招待メール送信 完了
const modalSendInvitaionSuccess = ref()

// Modal: 設定
const modalSettings = ref()

const speakerLength = ref(webrtcStore.peerMediasNum)
watch(webrtcStore.peerMedias, async () => {
  if (speakerLength.value > webrtcStore.peerMediasNum) {
    if (webrtcStore.peerMediasNum <= 1) {
      targetSpeakerPeerId.value = webrtcStore.myPeerId
    } else {
      const aryPeerIds = Object.keys(webrtcStore.peerMedias)
      // console.log('aryPeerIds', aryPeerIds)
      let iidx = aryPeerIds.length - 1
      targetSpeakerPeerId.value = aryPeerIds[iidx]
      while (targetSpeakerPeerId.value === webrtcStore.myPeerId) {
        iidx--
        targetSpeakerPeerId.value = aryPeerIds[iidx]
      }
      // console.log('targetSpeakerPeerId', targetSpeakerPeerId.value)
    }
  }
  if (speakerLength.value < webrtcStore.peerMediasNum) {
    if (webrtcStore.peerMediasNum === 1) {
      targetSpeakerPeerId.value = webrtcStore.myPeerId
    } else {
      const aryPeerIds = Object.keys(webrtcStore.peerMedias)
      // console.log('aryPeerIds', aryPeerIds)
      let iidx = aryPeerIds.length - 1
      targetSpeakerPeerId.value = aryPeerIds[iidx]
      while (targetSpeakerPeerId.value === webrtcStore.myPeerId) {
        iidx--
        targetSpeakerPeerId.value = aryPeerIds[iidx]
      }
      // console.log('targetSpeakerPeerId', targetSpeakerPeerId.value)
    }
  }
  speakerLength.value = webrtcStore.peerMediasNum
})

onMounted(async () => {
  // 状態: 退室
  statusEnterRoom.value = false

  // Room 情報取得
  try {
    await roomStore.getRoomByRoomHash(roomHash.value)
  } catch (err) {
    // Roomハッシュ値が不適切な（DBに無い）場合
    isBadRoomHash.value = true
    return false
  }

  // open my MediaStream
  await mediaStore.openMediaStream()

  // open Peer
  await webrtcStore.open({
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH
  })

  // Profile表示名を表示名初期値に設定
  const resProfile = await authStore.getProfile()
  myDisplayName.value = resProfile.data.username
})

onBeforeUnmount(async () => {
  if (statusEnterRoom.value) {
    await exitRoom()
  }

  await webrtcStore.close()

  mediaStore.closeMediaStream()
})

// top page へ遷移
const toTopPage = () => {
  // my page へ遷移
  if (authStore.isAuthenticated()) {
    router.push({ name: 'mypage' })
  } else {
    router.push({ name: 'index' })
  }
}

// Roomへの入室
const enterRoom = async () => {
  targetSpeakerPeerId.value = webrtcStore.myPeerId

  // 入室APIアクセス
  await roomStore.enterRoom(roomHash.value, webrtcStore.myPeerId, myDisplayName.value)

  // local mediaStream 設定
  webrtcStore.myMediaStream = mediaStore.mediaStream

  // 入室状態を取得
  const res2 = await roomStore.statusRoom(roomHash.value)
  res2.attenders.forEach(async (item: any) => {
    // 現在の参加者それぞれへメディア接続
    webrtcStore.connectMedia(item.peer_id, item.display_name)
  })

  // 状態: 入室
  statusEnterRoom.value = true

  // 相手の disconnect 不良への対応
  cIId = setInterval(() => {
    checkStatusPeerConn()
  }, 5000)
}

// Roomからの退室
const exitRoom = async () => {
  if (cIId !== null) {
    await clearInterval(cIId)
    cIId = null
  }

  targetSpeakerPeerId.value = ''

  // 状態: 退室
  statusEnterRoom.value = false

  // WebRTC - 退出
  webrtcStore.disconnectMedia()

  // 退室APIアクセス
  await roomStore.exitRoom(roomHash.value, webrtcStore.myPeerId)
}

// PeerConn 状態をチェック、改善処理
const checkStatusPeerConn = async () => {
  // status
  const res = await roomStore.statusRoom(roomHash.value)
  webrtcStore.checkMedias(res)
}

// video on/off
const toggleVideo = () => {
  mediaStore.setVideoEnabled(!trackStatus.value.video)
  trackStatus.value.video = !trackStatus.value.video
}

// Audio on/off
const toggleAudio = () => {
  mediaStore.setAudioEnabled(!trackStatus.value.audio)
  trackStatus.value.audio = !trackStatus.value.audio
}

// 画面表示モード 変更
const changeViewMode = () => {
  if (viewMode.value === 'speaker') {
    viewMode.value = 'matrix'
  } else if (viewMode.value === 'matrix') {
    viewMode.value = 'speaker'
  }
}

// 招待メール送信
const sendInviteMail = async () => {
  // サインインユーザー情報取得
  const profile = await authStore.getProfile()
  // 招待メール送信
  const options = {
    room_id: roomStore.room.id,
    user_id: profile.data.id,
    invite_email: invitedEmailAddress.value
  }
  await axios.post('/api/rooms/send_invite_mail', options)

  // 完了告知モーダルダイアログ表示
  modalSendInvitaionSuccess.value.open()
  setTimeout(() => {
    modalSendInvitaionSuccess.value.close()
  }, 2000)
}

const chooseSpeaker = (peerId: string) => {
  targetSpeakerPeerId.value = peerId
}
</script>

<template>
  <div class="h-full bg-slate-100">
    <template v-if="isBadRoomHash">
      <VccHeader />

      <div class="container mx-auto h-full rounded-xl border bg-slate-100 p-3">
        <div class="m-2">room ハッシュに誤りがあります。</div>
        <div class="m-2">
          <ButtonGeneralPrimary class="" @click="router.push({ name: 'index' })"
            >&lt;&lt; Topページへ戻る</ButtonGeneralPrimary
          >
        </div>
      </div>
    </template>
    <template v-else>
      <div class="h-full bg-slate-100" v-if="statusEnterRoom === false">
        <!-- 入室前状態 -->

        <VccHeader />
        <div class="container mx-auto">
          <div class="p-3">
            <video
              class="max-h-80 w-full bg-slate-100"
              :class="{ 'my-video-mirrored': myVideoMirrored }"
              :srcObject.prop="mediaStore.mediaStream"
              autoplay
              muted
              playsinline
            ></video>

            <div class="flex w-full justify-between">
              <div class="my-3 flex items-center justify-center">
                <ButtonGeneralSecondary class="h-12 w-20" @click="toTopPage">
                  &lt;&lt; 戻る
                </ButtonGeneralSecondary>
              </div>

              <div class="my-3 flex items-center justify-center">
                <!-- 設定 -->
                <ButtonGeneralPrimary
                  class="me-1 h-12"
                  @click="modalSettings.open()"
                >
                  設定
                </ButtonGeneralPrimary>
                <!-- // 設定 -->

                <!-- video on/off -->
                <ButtonGeneralPrimary
                  class="me-1 h-12 w-12"
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
                  class="me-0 h-12 w-12"
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

              <div class="w-20"></div>
            </div>
          </div>
          <div class="flex w-full justify-center">
            <div class="mx-3 w-full rounded-md border p-3 text-center">
              <!-- Room名称 Room Hash -->
              <div class="my-3">
                <div class="text-xl font-semibold">{{ roomStore.room.room_name }}</div>
                <div class="">{{ roomStore.room.room_hash }}</div>
              </div>
              <!-- // Room名称 Room Hash -->

              <!-- 表示名 設定 -->
              <div class="my-3 flex">
                <InputEmail
                  class="me-2 h-10 w-full"
                  placeholder="表示名"
                  v-model="myDisplayName"
                />
                <ButtonGeneralPrimary
                  class="me-0 h-10 w-20"
                  :class="{
                    'bg-slate-400 hover:bg-slate-400':
                      myDisplayName === '' || !mediaStore.mediaStream?.active
                  }"
                  @click="enterRoom"
                  :disabled="myDisplayName === '' || !mediaStore.mediaStream?.active"
                >
                  入室
                </ButtonGeneralPrimary>
              </div>
              <!-- // 表示名 設定 -->

              <!-- メールで招待する -->
              <div class="my-3 text-left" v-if="authStore.isAuthenticated()">
                <div class="text-md font-semibold">招待する</div>
                <div class="">
                  <p class="text-xs">メールアドレスを入力後［送信］を押してください。</p>
                </div>
                <div class="my-3 flex">
                  <InputEmail class="me-2 h-10 w-full" v-model="invitedEmailAddress" />
                  <ButtonGeneral
                    class="me-0 h-10 w-20 bg-green-500 hover:bg-green-600"
                    :disabled="invitedEmailAddress.length === 0"
                    @click="sendInviteMail"
                  >
                    送信
                  </ButtonGeneral>
                </div>
              </div>
              <!-- // メールで招待する -->
            </div>
          </div>
        </div>

        <!-- // 入室前状態 -->
      </div>
      <div class="" v-else>
        <!-- 入室(meeting)状態 -->

        <div v-if="viewMode === 'speaker'">
          <div class="relative h-screen bg-slate-500">
            <!-- UI -->
            <div class="absolute bottom-3 right-3 z-10 rounded-md bg-slate-200 p-2">
              <div class="flex">
                <ButtonGeneralPrimary class="w-18 me-1 h-12" @click="changeViewMode">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-person-fill"
                    viewBox="0 0 16 16"
                    v-if="viewMode === 'speaker'"
                  >
                    <path
                      d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-grid-3x3"
                    viewBox="0 0 16 16"
                    v-else
                  >
                    <path
                      d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z"
                    />
                  </svg>
                </ButtonGeneralPrimary>

                <ButtonGeneralPrimary
                  class="me-1 h-12 w-12"
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

                <ButtonGeneralPrimary
                  class="me-2 h-12 w-12"
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

                <ButtonGeneralDanger class="me-0 border-2" @click="exitRoom">
                  退室
                </ButtonGeneralDanger>
              </div>
            </div>
            <!-- // UI -->

            <!-- speakers list -->
            <div
              class="max-w-screen absolute left-0 top-3 z-20 overflow-x-hidden rounded-sm border border-slate-500 bg-slate-300"
            >
              <div class="speakers flex flex-nowrap justify-start">
                <div
                  class="relative flex h-24 w-32 items-center"
                  v-for="pm in webrtcStore.peerMedias"
                  :key="pm.peerId"
                  @click="chooseSpeaker(pm.peerId)"
                >
                  <video
                    class="h-full w-full"
                    :class="{
                      'my-video-mirrored': myVideoMirrored && pm.peerId === webrtcStore.myPeerId
                    }"
                    :srcObject.prop="pm.mediaStream"
                    autoplay
                    muted
                    playsinline
                  ></video>
                  <audio
                    class=""
                    :srcObject.prop="pm.mediaStream"
                    autoplay
                    v-if="pm.peerId !== webrtcStore.myPeerId"
                  ></audio>
                  <div
                    class="absolute bottom-0 left-0 z-10 rounded-md bg-black p-1 text-xs font-bold text-white"
                  >
                    <div class="">
                      {{ pm.displayName }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- // speakers list -->

            <!-- current speaker -->
            <div class="main-speaker-view flex w-screen flex-wrap justify-center bg-slate-500">
              <video
                class="h-full w-full"
                :class="{
                  'my-video-mirrored':
                    myVideoMirrored &&
                    webrtcStore.peerMedias[targetSpeakerPeerId].peerId === webrtcStore.myPeerId
                }"
                :srcObject.prop="webrtcStore.peerMedias[targetSpeakerPeerId].mediaStream"
                autoplay
                muted
                playsinline
              ></video>
              <div
                class="absolute bottom-0 left-0 z-10 rounded-md bg-black p-1 text-xs font-bold text-white"
              >
                <div class="">
                  {{ webrtcStore.peerMedias[targetSpeakerPeerId].displayName }}
                </div>
              </div>
            </div>
            <!-- // current speaker -->
          </div>
        </div>
        <div class="" v-else>
          <div class="flex h-screen w-screen flex-wrap items-center justify-center">
            <!-- UI -->
            <div class="absolute bottom-3 right-3 z-10 rounded-md bg-slate-200 p-2">
              <div class="flex">
                <ButtonGeneralPrimary class="w-18 me-1 h-12" @click="changeViewMode">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-person-fill"
                    viewBox="0 0 16 16"
                    v-if="viewMode === 'speaker'"
                  >
                    <path
                      d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-grid-3x3"
                    viewBox="0 0 16 16"
                    v-else
                  >
                    <path
                      d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5zM1.5 1a.5.5 0 0 0-.5.5V5h4V1zM5 6H1v4h4zm1 4h4V6H6zm-1 1H1v3.5a.5.5 0 0 0 .5.5H5zm1 0v4h4v-4zm5 0v4h3.5a.5.5 0 0 0 .5-.5V11zm0-1h4V6h-4zm0-5h4V1.5a.5.5 0 0 0-.5-.5H11zm-1 0V1H6v4z"
                    />
                  </svg>
                </ButtonGeneralPrimary>

                <ButtonGeneralPrimary
                  class="me-1 h-12 w-12"
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

                <ButtonGeneralPrimary
                  class="me-2 h-12 w-12"
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

                <ButtonGeneralDanger class="me-0 border-2" @click="exitRoom">
                  退室
                </ButtonGeneralDanger>
              </div>
            </div>
            <!-- // UI -->

            <div
              class="relative flex items-center border bg-slate-500"
              :class="{
                'w-full':
                  1 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 2,
                'w-1/2':
                  3 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 4,
                'w-1/3':
                  5 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 12,
                'w-1/4':
                  13 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 20,
                'h-full':
                  1 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 1,
                'h-1/2':
                  2 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 6,
                'h-1/3':
                  7 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 9,
                'h-1/4':
                  10 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 16,
                'h-1/5':
                  17 <= Object.keys(webrtcStore.peerMedias).length &&
                  Object.keys(webrtcStore.peerMedias).length <= 20
              }"
              v-for="(pm, peerId) in webrtcStore.peerMedias"
              :key="peerId"
            >
              <video
                class="h-full w-full"
                :class="{
                  'my-video-mirrored': myVideoMirrored && pm.peerId === webrtcStore.myPeerId
                }"
                :srcObject.prop="pm.mediaStream"
                autoplay
                muted
                playsinline
              ></video>
              <audio
                class=""
                :srcObject.prop="pm.mediaStream"
                autoplay
                v-if="pm.peerId !== webrtcStore.myPeerId"
              ></audio>
              <div
                class="absolute bottom-0 left-0 z-10 rounded-md bg-black p-3 text-xl font-bold text-white"
              >
                <div class="">
                  {{ pm.displayName }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- // 入室(meeting)状態 -->
      </div>
    </template>
  </div>

  <ModalGeneral ref="modalSendInvitaionSuccess">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">招待メール</div>
        <div class="m-3">送信しました。</div>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalSettings">
    <div class="p-5">
      <div class="text-center font-bold">
        設定
      </div>
      
      <div class="w-96 px-2 py-5 my-5 border">
        <InputCheckbox class="" v-model="myVideoMirrored">自身の画像を鏡映反転する</InputCheckbox>
      </div>

      <div class="w-96 px-2 py-5 my-5 border">
        <div class="font-bold">映像入力</div>
        <select class="" v-model="mediaStore.videoInputDeviceId" @change="mediaStore.changeVideoInput">
          <template v-for="(val, sKey) in mediaStore.deviceVideoInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="w-96 px-2 py-5 my-5 border">
        <div class="font-bold">音声入力</div>
        <select class="" v-model="mediaStore.audioInputDeviceId" @change="mediaStore.changeAudioInput">
          <template v-for="(val, sKey) in mediaStore.deviceAudioInputs" :key="sKey">
            <option :value="val.deviceId">
              {{ val.label }}
            </option>
          </template>
        </select>
      </div>

      <div class="w-96 px-2 py-5 my-5 border">
        <div class="font-bold">音声出力</div>
        <select class="" v-model="mediaStore.audioOutputDeviceId" @change="mediaStore.changeAudioOutput">
          <template v-for="(val, sKey) in mediaStore.deviceAudioOutputs" :key="sKey">
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
.speakers {
  width: calc(8rem * v-bind(speakerLength));
}

.main-speaker-view {
  height: calc(100vh - 100px);
}

.my-video-mirrored {
  transform: scaleX(-1);
}
</style>
