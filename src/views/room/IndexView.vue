<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { axios } from '@/lib/Axios'
import { useAuthStore } from '@/stores/auth'
import { useWebrtcStore } from '@/stores/webrtc'
import { useMediaDeviceStore } from '@/stores/mediaDevice'
import { useMediaStreamStore } from '@/stores/mediaStream'
import { useRoomStore } from '@/stores/rooms'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import ButtonGeneralDanger from '@/components/ui/ButtonGeneralDanger.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import ModalGeneral from '@/components/ModalGeneral.vue'
import VccHeader from '@/components/VccHeader.vue'
import InputCheckbox from '@/components/ui/InputCheckbox.vue'
import ModalessGeneral from '@/components/ModalessGeneral.vue'
import InputText from '@/components/ui/InputText.vue'
import MeetingController from '@/components/MeetingController.vue'
import vue from '@vitejs/plugin-vue'

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const webrtcStore = useWebrtcStore()
const mediaDeviceStore = useMediaDeviceStore()
const mediaStreamStore = useMediaStreamStore()
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

// NotFound (== bad room hash)
const isBadRoomHash = ref<boolean>(false)

// settings: 右サイド・設定欄 : '' | 'chat' | 'settings' | 'virtual-background'
const rightSideSettings = ref('')

// media stream
const mediaStream = ref<MediaStream>(new MediaStream())

// video mode
const videoMode = ref('normal:0')
const videoModeTmp = ref('normal:0')
const videoModes = ref({
  'normal:0': '通常',
  'blur:10': 'ぼかし10',
  'blur:30': 'ぼかし30',
  'image:/bgimage1.jpg': '壁紙１',
  'image:/bgimage2.jpg': '壁紙２'
})

// my MediaStream video/audio
const trackStatus = ref({ video: true, audio: true })

// 自身画像の鏡映反転 on/off
const myVideoMirrored = ref(true)

// my display name
const myDisplayName = ref('')
watch(myDisplayName, () => {
  mediaStreamStore.altText = webrtcStore.myName = myDisplayName.value
})

// 招待メール送信先メールアドレス
const invitedEmailAddress = ref<string>('')

// 状態: 入室 / 退室
const statusEnterRoom = ref(false)

// view mode (speaker|matrix)
const viewMode = ref<'speaker' | 'matrix'>('speaker')

// Speaker View - 現在のスピーカーの Peer ID.
const targetSpeakerPeerId = ref('')

// dataConn（チャット）用 メッセージ
const messageText = ref('')

// check interval ID.
let cIId: any = null

// Modal: dataConn datalist
const modalDataConnList = ref()

// Modal: 招待メール送信 完了
const modalSendInvitaionSuccess = ref()

// Modal: 設定
const modalSettings = ref()

const startRoom = async () => {
  window.addEventListener('beforeunload', unloadFunc)

  // 状態: 退室
  statusEnterRoom.value = false

  // canvas text
  mediaStreamStore.altText = webrtcStore.myName = myDisplayName.value = ''

  // Room 情報取得
  try {
    await roomStore.getRoomByRoomHash(roomHash.value)
  } catch (err) {
    // Roomハッシュ値が不適切な（DBに無い）場合
    isBadRoomHash.value = true
    return false
  }

  // open the mediastream
  await mediaDeviceStore.init()
  await mediaStreamStore.openNormal(mediaDeviceStore.mediaStreamConstraints)
  mediaStreamStore.openAltText()
  await mediaStreamStore.openVirtualBackground(mediaDeviceStore.mediaStreamConstraints)

  // normal mediaStream 設定
  webrtcStore.myMediaStream = mediaStream.value =
    mediaStreamStore.mediaStreamNormal?.clone() as MediaStream
  trackStatus.value = { video: true, audio: true }

  // open Peer
  await webrtcStore.open({
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH
  })

  // Profile表示名を表示名初期値に設定
  if (authStore.isAuthenticated()) {
    const resProfile = await authStore.getProfile()
    mediaStreamStore.altText = webrtcStore.myName = myDisplayName.value = resProfile.data.username
  }
}
onMounted(startRoom)

const endRoom = async () => {
  window.removeEventListener('beforeunload', unloadFunc)

  if (statusEnterRoom.value) {
    await exitRoom()
  }

  await webrtcStore.close()

  await mediaStreamStore.closeVirtualBackground()
  await mediaStreamStore.closeAltText()
  await mediaStreamStore.closeNormal()

  // close the mediaStream
  mediaStream.value.getTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })
}
onBeforeUnmount(endRoom)
// beforeunload
const unloadFunc = async () => {
  await endRoom()
}

webrtcStore.peerOnCallCallback = async (options: any) => {
  console.info('----- webrtcStore.peerOnCallCallback() -----')
  if (options.peer_id) {
    console.info('options.peer_id', options.peer_id)
    targetSpeakerPeerId.value = options.peer_id
  }
}

webrtcStore.peerOnErrorCallback = async (options: any) => {
  console.info('----- webrtcStore.peerOnErrorCallback() -----')
  if (options.type) {
    console.info('options.type   :', options.type)
    console.info('options.peer_id:', options.peer_id)
  }
  // await endRoom()
  // await startRoom()
}

webrtcStore.mediaConnOnCloseCallback = async (options: any) => {
  console.info('----- webrtcStore.mediaConnOnCloseCallback() -----')
  if (options) {
    console.info('options.peer_id:', options.peer_id)
  }

  if (Object.keys(webrtcStore.peerMedias).length >= 2) {
    // 他の人との接続があれば、Spearkerモードでは他の人をターゲットにする
    Object.keys(webrtcStore.peerMedias).forEach((peerId) => {
      if (peerId !== webrtcStore.myPeerId) {
        targetSpeakerPeerId.value = peerId
      }
    })
  } else {
    // 他の人との接続が無い（自分のみ）であれば、Speakerモードでは自分をターゲットにする
    targetSpeakerPeerId.value = webrtcStore.myPeerId
  }
}

// top page へ遷移
const toTopPage = () => {
  // my page へ遷移
  if (authStore.isAuthenticated()) {
    router.push({ name: 'mypage' })
  } else {
    router.push({ name: 'index' })
  }
}

//
const toggleRightSideSettings = (value: '' | 'chat' | 'settings' | 'virtual-background') => {
  if (rightSideSettings.value === value) {
    rightSideSettings.value = ''
  } else {
    rightSideSettings.value = value
  }
}

// バーチャル背景 mediaStream 切替
const changeVideoMode = async () => {
  trackStatus.value.video = true

  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  const selected = videoMode.value.match(/(.+):(.+)/)
  if (selected) {
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
}

// Roomへの入室
const enterRoom = async () => {
  if (webrtcStore.myPeerId === '') {
    console.error('no my peer id.')
    throw new Error('no my peer id.')
  }

  // init.
  // 表示名
  mediaStreamStore.altText = webrtcStore.myName = myDisplayName.value
  // Peer ID.
  targetSpeakerPeerId.value = webrtcStore.myPeerId
  // dataConnData 初期化
  webrtcStore.dataConnData = []

  // 入室APIアクセス
  await roomStore.enterRoom(roomHash.value, webrtcStore.myPeerId, myDisplayName.value)

  // 入室状態を取得
  const roomInfo = await roomStore.statusRoom(roomHash.value)
  roomInfo.attenders.forEach(async (item: any) => {
    // 現在の参加者それぞれへメディア接続
    await webrtcStore.connectMedia(item.peer_id, item.display_name)
  })

  // 相手の disconnect 不良への対応
  cIId = setInterval(() => {
    checkStatusPeerConn()
  }, 5000)

  // // open dataConn modal
  // modalDataConnList.value.open()

  // 状態: 入室
  statusEnterRoom.value = true
}

// Roomからの退室
const exitRoom = async () => {
  // 状態: 退室
  statusEnterRoom.value = false

  // // close dataConn modal
  // modalDataConnList.value.close()

  if (cIId !== null) {
    await clearInterval(cIId)
    cIId = null
  }

  targetSpeakerPeerId.value = webrtcStore.myPeerId

  // 退室APIアクセス
  await roomStore.exitRoom(roomHash.value, webrtcStore.myPeerId)

  // WebRTC - 退出
  webrtcStore.disconnectMedia()
}

// PeerConn 状態をチェック、改善処理
const checkStatusPeerConn = async () => {
  // status
  const res = await roomStore.statusRoom(roomHash.value)
  webrtcStore.checkMedias(res)
}

// video on/off
const toggleVideo = async () => {
  trackStatus.value.video = !trackStatus.value.video

  if (statusEnterRoom.value) {
    // media すべて切断
    await webrtcStore.disconnectMedia2()
  }

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
  webrtcStore.myMediaStream = mediaStream.value

  if (statusEnterRoom.value) {
    // 入室状態を取得
    const roomInfo = await roomStore.statusRoom(roomHash.value)
    roomInfo.attenders.forEach(async (item: any) => {
      // 現在の参加者それぞれへメディア再接続
      await webrtcStore.connectMedia2(item.peer_id)
    })
  }
}

// audio on/off
const toggleAudio = () => {
  trackStatus.value.audio = !trackStatus.value.audio
  mediaStream.value.getAudioTracks().forEach((tr: MediaStreamTrack) => {
    tr.enabled = trackStatus.value.audio
  })
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

// Speaker mode: Clickしたユーザーを Speaker に設定
const chooseSpeaker = (peerId: string) => {
  targetSpeakerPeerId.value = peerId
}

// Text-chat: メッセージ送信
const sendText = () => {
  webrtcStore.sendDataAll(messageText.value)
}

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
  await mediaStreamStore.closeAltText()
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

const showInfoLog = () => {
  webrtcStore.showInfoLog()
}
</script>

<template>
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
    <template v-if="statusEnterRoom === false">
      <div class="bg-slate-100 pb-10">
        <!-- 入室前状態 -->

        <VccHeader />
        <div class="container mx-auto">
          <div class="p-3">
            <video
              class="max-h-80 w-full bg-slate-100"
              :class="{ 'my-video-mirrored': myVideoMirrored && videoMode !== 'alt-text' }"
              :srcObject.prop="mediaStream"
              autoplay
              muted
              playsinline
            ></video>
            <!--
            <audio
              :srcObject.prop="mediaStream"
              autoplay
              playsinline
            ></audio>
            -->

            <div class="flex w-full justify-between">
              <div class="my-3 flex items-center justify-center">
                <!-- 戻る -->
                <ButtonGeneralSecondary class="h-12 w-20" @click="toTopPage">
                  &lt;&lt; 戻る
                </ButtonGeneralSecondary>
                <!-- // 戻る -->
              </div>

              <div class="my-3 flex items-center justify-center">
                <!-- showInfoLog -->
                <ButtonGeneralPrimary class="me-1 h-12" @click="showInfoLog">
                  info
                </ButtonGeneralPrimary>
                <!-- // showInfoLog -->

                <!-- 設定 -->
                <ButtonGeneralPrimary class="me-1 h-12" @click="modalSettings.open()">
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
                  class="me-1 h-12 w-12"
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

                <!-- 背景設定 -->
                <select class="w-28 p-3" v-model="videoMode" @change="changeVideoMode">
                  <template v-for="(val, sKey) in videoModes" :key="sKey">
                    <option :value="sKey">
                      {{ val }}
                    </option>
                  </template>
                </select>
                <!-- // 背景設定 -->
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
                <div class="">{{ webrtcStore.myPeerId }}</div>
              </div>
              <!-- // Room名称 Room Hash -->

              <!-- 表示名 設定 -->
              <div class="my-3 flex">
                <InputText class="me-2 h-10 w-full" placeholder="表示名" v-model="myDisplayName" />
                <ButtonGeneralPrimary
                  class="me-0 h-10 w-20"
                  :class="{
                    'bg-slate-400 hover:bg-slate-400':
                      myDisplayName === '' || webrtcStore.myPeerId === '' || !mediaStream?.active
                  }"
                  @click="enterRoom"
                  :disabled="
                    myDisplayName === '' || webrtcStore.myPeerId === '' || !mediaStream?.active
                  "
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
    </template>
    <template v-else>
      <div class="">
        <!-- 入室(meeting)状態 -->

        <div class="mx-auto h-screen w-screen">
          <!-- main -->
          <div class="main flex justify-start">
            <div class="meeting relative" :class="{'meeting-full': rightSideSettings === '' }">
              <!-- ViewMode: Speaker -->
              <template v-if="viewMode === 'speaker'">
                <!-- speakers list -->
                <div
                  class="absolute bottom-0 left-0 z-20 overflow-x-hidden rounded-sm border-2 border-slate-500 bg-slate-300"
                >
                  <div class="flex flex-nowrap justify-start">
                    <div
                      class="relative flex h-36 w-60 items-center"
                      v-for="pm in webrtcStore.peerMedias"
                      :key="pm.peerId"
                      @click="chooseSpeaker(pm.peerId)"
                    >
                      <template v-if="pm.available">
                        <video
                          class="h-96 w-96"
                          :class="{
                            'my-video-mirrored':
                              myVideoMirrored && pm.peerId === webrtcStore.myPeerId
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
                            {{ webrtcStore.peerMedias[pm.peerId].displayName }}
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
                <!-- // speakers list -->

                <!-- current speaker -->
                <div
                  class="main-speaker-view relative flex flex-wrap justify-center bg-slate-500"
                  v-if="targetSpeakerPeerId !== ''"
                >
                  <template v-if="webrtcStore.peerMedias[targetSpeakerPeerId].available">
                    <video
                      class="h-full w-full"
                      :class="{
                        'my-video-mirrored':
                          myVideoMirrored &&
                          webrtcStore.peerMedias[targetSpeakerPeerId].peerId ===
                            webrtcStore.myPeerId
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
                  </template>
                </div>
                <!-- // current speaker -->
              </template>
              <!-- // ViewMode: Speaker -->
              <!-- ViewMode: Matrix -->
              <template v-else>
                <div class="main-matrix-view flex flex-wrap items-center justify-center">
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
                    <template v-if="pm.available">
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
                          {{ webrtcStore.peerMedias[pm.peerId].displayName }}
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
              <!-- // ViewMode: Matrix -->
              <!-- // 入室(meeting)状態 -->
            </div>
            <div class="rightside" v-if="rightSideSettings !== ''">
              <template v-if="rightSideSettings === 'chat'">
                <div class="chat h-full w-full">
                  <div class="my-2 ms-2 font-bold">チャット</div>
                  <div class="chat__content h-full overflow-y-auto">
                    <div v-for="(item, idx) in webrtcStore.dataConnData" :key="idx">
                      {{ item.type }}: - {{ item.message }}
                    </div>
                  </div>
                  <div class="my-0 p-3">
                    <InputText class="w-60 p-2" v-model="messageText" />
                    <ButtonGeneralPrimary class="w-20" @click="sendText">
                      送信
                    </ButtonGeneralPrimary>
                  </div>
                </div>
              </template>
              <template v-else-if="rightSideSettings === 'virtual-background'">
                <!-- 背景設定 -->
                <select class="w-28 p-3" v-model="videoMode" @change="changeVideoMode">
                  <template v-for="(val, sKey) in videoModes" :key="sKey">
                    <option :value="sKey">
                      {{ val }}
                    </option>
                  </template>
                </select>
                <!-- // 背景設定 -->
              </template>
              <template v-else-if="rightSideSettings === 'settings'">
                <div class="p-5">
                  <div class="text-center font-bold">設定</div>

                  <div class="my-5 w-96 border px-2 py-5">
                    <InputCheckbox class="" v-model="myVideoMirrored"
                      >自身の画像を鏡映反転する</InputCheckbox
                    >
                  </div>

                  <div
                    class="my-5 w-96 border px-2 py-3"
                    v-if="mediaDeviceStore.deviceVideoInputs.length > 0"
                  >
                    <div class="font-bold">映像入力</div>
                    <select
                      class="mt-3 w-full border p-3"
                      v-model="mediaDeviceStore.videoInputDeviceId"
                      @change="changeVideoInput"
                    >
                      <template
                        v-for="(val, sKey) in mediaDeviceStore.deviceVideoInputs"
                        :key="sKey"
                      >
                        <option :value="val.deviceId">
                          {{ val.label }}
                        </option>
                      </template>
                    </select>
                  </div>

                  <div
                    class="my-5 w-96 border px-2 py-3"
                    v-if="mediaDeviceStore.deviceAudioInputs.length > 0"
                  >
                    <div class="font-bold">音声入力</div>
                    <select
                      class="mt-3 w-full border p-3"
                      v-model="mediaDeviceStore.audioInputDeviceId"
                      @change="changeAudioInput"
                    >
                      <template
                        v-for="(val, sKey) in mediaDeviceStore.deviceAudioInputs"
                        :key="sKey"
                      >
                        <option :value="val.deviceId">
                          {{ val.label }}
                        </option>
                      </template>
                    </select>
                  </div>

                  <!--
                  <div class="">
                    <ButtonGeneralPrimary class="" @click="modalSettings.close()">
                      close
                    </ButtonGeneralPrimary>
                  </div>
                  -->
                </div>
              </template>
            </div>
          </div>
          <!-- // main -->
          <!-- footer -->
          <div class="footer-menu flex h-16 items-center justify-between bg-slate-200 p-10">
            <MeetingController
              :viewMode="viewMode"
              :trackStatusVideo="trackStatus.video"
              :trackStatusAudio="trackStatus.audio"
              @change-view-mode="changeViewMode"
              @toggle-video="toggleVideo"
              @toggle-audio="toggleAudio"
              @exit-room="exitRoom"
              @open-chat="toggleRightSideSettings('chat')"
              @open-settings="toggleRightSideSettings('settings')"
              @open-bg="toggleRightSideSettings('virtual-background')"
            />
          </div>
          <!-- // footer -->
        </div>
      </div>
    </template>
  </template>

  <!--
  <div class="w-full h-full bg-slate-100">
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
      <div class="bg-slate-100 pb-10" v-if="statusEnterRoom === false">
        <! -- 入室前状態 -- >

        <VccHeader />
        <div class="container mx-auto">
          <div class="p-3">
            <video
              class="max-h-80 w-full bg-slate-100"
              :class="{ 'my-video-mirrored': myVideoMirrored && videoMode !== 'alt-text' }"
              :srcObject.prop="mediaStream"
              autoplay
              muted
              playsinline
            ></video>
            <! --
            <audio
              :srcObject.prop="mediaStream"
              autoplay
              playsinline
            ></audio>
            -- >

            <div class="flex w-full justify-between">
              <div class="my-3 flex items-center justify-center">
                <! -- 戻る -- >
                <ButtonGeneralSecondary class="h-12 w-20" @click="toTopPage">
                  &lt;&lt; 戻る
                </ButtonGeneralSecondary>
                <! -- // 戻る -- >
              </div>

              <div class="my-3 flex items-center justify-center">
                <! -- showInfoLog -- >
                <ButtonGeneralPrimary class="me-1 h-12" @click="showInfoLog">
                  info
                </ButtonGeneralPrimary>
                <! -- // showInfoLog -- >

                <! -- 設定 -- >
                <ButtonGeneralPrimary class="me-1 h-12" @click="modalSettings.open()">
                  設定
                </ButtonGeneralPrimary>
                <! -- // 設定 -- >

                <! -- video on/off -- >
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
                <! -- // video on/off -- >

                <! -- mic on/off -- >
                <ButtonGeneralPrimary
                  class="me-1 h-12 w-12"
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
                <! -- // mic on/off -- >

                <! -- 背景設定 -- >
                <select class="w-28 p-3" v-model="videoMode" @change="changeVideoMode">
                  <template v-for="(val, sKey) in videoModes" :key="sKey">
                    <option :value="sKey">
                      {{ val }}
                    </option>
                  </template>
                </select>
                <! -- // 背景設定 -- >
              </div>

              <div class="w-20"></div>
            </div>
          </div>
          <div class="flex w-full justify-center">
            <div class="mx-3 w-full rounded-md border p-3 text-center">
              <! -- Room名称 Room Hash -- >
              <div class="my-3">
                <div class="text-xl font-semibold">{{ roomStore.room.room_name }}</div>
                <div class="">{{ roomStore.room.room_hash }}</div>
                <div class="">{{ webrtcStore.myPeerId }}</div>
              </div>
              <! -- // Room名称 Room Hash -- >

              <! -- 表示名 設定 -- >
              <div class="my-3 flex">
                <InputText class="me-2 h-10 w-full" placeholder="表示名" v-model="myDisplayName" />
                <ButtonGeneralPrimary
                  class="me-0 h-10 w-20"
                  :class="{
                    'bg-slate-400 hover:bg-slate-400':
                      myDisplayName === '' || webrtcStore.myPeerId === '' || !mediaStream?.active
                  }"
                  @click="enterRoom"
                  :disabled="
                    myDisplayName === '' || webrtcStore.myPeerId === '' || !mediaStream?.active
                  "
                >
                  入室
                </ButtonGeneralPrimary>
              </div>
              <! -- // 表示名 設定 -- >

              <! -- メールで招待する -- >
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
              <! -- // メールで招待する -- >
            </div>
          </div>
        </div>

        <! -- // 入室前状態 -- >
      </div>
      <div class="" v-else>
        <! -- 入室(meeting)状態 -- >

        <div v-if="viewMode === 'speaker'">
          <div class="relative h-screen bg-slate-500">
            <! -- UI -- >
            <div class="absolute bottom-3 right-3 z-10 rounded-md">
            </div>
            <! -- // UI -- >

            <! -- speakers list -- >
            <div
              class="max-w-screen absolute left-0 top-3 z-20 overflow-x-hidden rounded-sm border border-slate-500 bg-slate-300"
            >
              <div class="flex w-full flex-nowrap justify-start">
                <div
                  class="relative flex h-24 w-32 items-center"
                  v-for="pm in webrtcStore.peerMedias"
                  :key="pm.peerId"
                  @click="chooseSpeaker(pm.peerId)"
                >
                  <template v-if="pm.available">
                    <video
                      class="h-96 w-96"
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
                        {{ webrtcStore.peerMedias[pm.peerId].displayName }}
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <! -- // speakers list -- >

            <! -- current speaker -- >
            <div
              class="main-speaker-view flex w-screen flex-wrap justify-center bg-slate-500"
              v-if="targetSpeakerPeerId !== ''"
            >
              <template v-if="webrtcStore.peerMedias[targetSpeakerPeerId].available">
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
              </template>
            </div>
            <! -- // current speaker -- >
          </div>
        </div>
        <div class="" v-else>
          <div class="flex h-screen w-screen flex-wrap items-center justify-center">
            <! -- UI -- >
            <div class="absolute bottom-3 right-3 z-10 rounded-md">
              <MeetingController
                :trackStatusVideo="trackStatus.video"
                :trackStatusAudio="trackStatus.audio"
                @change-view-mode="changeViewMode"
                @toggle-video="toggleVideo"
                @toggle-audio="toggleAudio"
                @exit-room="exitRoom"
              />
            </div>
            <! -- // UI -- >

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
              <template v-if="pm.available">
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
                    {{ webrtcStore.peerMedias[pm.peerId].displayName }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <! -- // 入室(meeting)状態 -- >
      </div>
    </template>
  </div>
  -->

  <ModalessGeneral ref="modalDataConnList" :pos-left="750" :pos-top="100">
    <div class="h-fit w-96">
      <div class="">data conn.</div>
      <div class="h-fit max-h-96 min-h-80 w-full overflow-y-auto border border-red-300">
        <div v-for="(item, idx) in webrtcStore.dataConnData" :key="idx">
          {{ item.type }}: - {{ item.message }}
        </div>
      </div>
      <div class="">
        <InputText class="w-80" v-model="messageText" />
        <ButtonGeneralPrimary class="w-18" @click="sendText"> 送信 </ButtonGeneralPrimary>
      </div>
    </div>
  </ModalessGeneral>

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
.main {
  width: 100%;
  height: calc(100vh - 80px);
  // border: 3px yellow solid;
}

.meeting {
  width: calc(100vw - 374px - 6px);
  height: 100%;
  border: 0 blue dashed;
}
.meeting-full {
  width: calc(100vw - 6px);
}

.rightside {
  width: 374px;
  height: 100%;
  background-color: #fff8f8;
}

.chat {
  width: calc(100% - 20px);
  height: calc(100% - 100px);
  margin: 0 auto;
  background-color: #fafafa;

  &__content {
    width: 100%;
    height: calc(100% - 10px);
    border: 1px red dashed;
  }
}

.main-speaker-view,
.main-matrix-view {
  height: calc(100vh - 80px);
}

.my-video-mirrored {
  transform: scaleX(-1);
}
</style>
