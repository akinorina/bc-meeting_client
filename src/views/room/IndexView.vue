<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { axios } from '@/lib/Axios'
import { useAuthStore } from '@/stores/auth'
import { useWebrtcStore } from '@/stores/webrtc'
import { useMediaDeviceStore } from '@/stores/mediaDevice'
import { useMediaStreamNormalStore } from '@/stores/mediaStreamNormal';
import { useMediaStreamAlttextStore } from '@/stores/mediaStreamAlttext';
import { useMediaStreamVbgStore } from '@/stores/mediaStreamVbg';
import { useMediaStreamBlurStore } from '@/stores/mediaStreamBlur';
import { useRoomStore } from '@/stores/rooms'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import ModalGeneral from '@/components/ModalGeneral.vue'
import VccHeader from '@/components/VccHeader.vue'
import InputText from '@/components/ui/InputText.vue'
import MeetingController from '@/components/MeetingController.vue'
import RightsideMenu from '@/components/RightsideMenu.vue'
import TextChat from '@/components/TextChat.vue'
import SelectVirtualBackground from '@/components/SelectVirtualBackground.vue'
import type { BackgroundSettingObject } from '@/lib'
import backgroundData from '@/assets/background.json'
import SettingParts from '@/components/SettingParts.vue'

// Speaker view 有効ボリューム minimum値
const VOLUME_VALID_VALUE = 10

const router = useRouter()
const route = useRoute()

const authStore = useAuthStore()
const webrtcStore = useWebrtcStore()

const numOfPeers = ref(0)
watch(webrtcStore.peerMedias, () => {
  numOfPeers.value = Object.keys(webrtcStore.peerMedias).length
})

const mediaDeviceStore = useMediaDeviceStore()
const mediaStreamNormalStore = useMediaStreamNormalStore()
const mediaStreamAltTextStore = useMediaStreamAlttextStore()
const mediaStreamBlurStore = useMediaStreamBlurStore()
const mediaStreamVbgStore = useMediaStreamVbgStore()
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

// media stream
const mediaStream = ref<MediaStream>(new MediaStream())

// video mode
const videoMode = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
const videoModeTmp = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
const videoModeBefore = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
const videoModeData = ref<BackgroundSettingObject>(backgroundData as BackgroundSettingObject)

// my MediaStream video/audio
const trackStatus = ref({ video: true, audio: true })

// 自身画像の鏡映反転 on/off
const myVideoMirrored = ref(true)

// my display name
const myDisplayName = ref('')
watch(myDisplayName, () => {
  mediaStreamAltTextStore.altText = webrtcStore.myName = myDisplayName.value
})

// 招待メール送信先メールアドレス
const invitedEmailAddress = ref<string>('')

// 状態: 入室 / 退室
const statusEnterRoom = ref(false)

// view mode (speaker|matrix)
const viewMode = ref<'speaker' | 'matrix'>('matrix')

// Speaker View - 現在のスピーカーの Peer ID.
const targetSpeakerPeerId = ref('')

// check interval ID.
let cIId: any = null
let cIId2: any = null

// Modal: 招待メール送信 完了
const modalSendInvitaionSuccess = ref()

// Modal: getUserMedia() 失敗
const modalFailureGettingUserMedia = ref()

// Modal: Alert メッセージ
const modalAlertMessage = ref()
const textAlertType = ref('')
const textAlertMessage = ref('')

// Modal: 設定
const modalSettings = ref()

const startRoom = async () => {
  window.addEventListener('beforeunload', unloadFunc)

  // 状態: 退室
  statusEnterRoom.value = false

  // canvas text
  mediaStreamAltTextStore.altText = webrtcStore.myName = myDisplayName.value = ''

  // Room 情報取得
  try {
    await roomStore.getRoomByRoomHash(roomHash.value)
  } catch (err) {
    // Roomハッシュ値が不適切な（DBに無い）場合
    router.push({ name: 'room_not-found' })
    return false
  }

  // open the mediastream
  try {
    await mediaDeviceStore.init()
    // normalモード
    videoMode.value = 'normal'
    await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
  } catch (err: any) {
    if (err.message === 'coud not get a User Media.') {
      modalFailureGettingUserMedia.value.open()
    }
  }

  // normal mediaStream 設定
  mediaStream.value = mediaStreamNormalStore.getMediaStream() as MediaStream
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
    mediaStreamAltTextStore.altText = webrtcStore.myName = myDisplayName.value = resProfile.data.username
  }
}
onMounted(startRoom)

const endRoom = async () => {
  window.removeEventListener('beforeunload', unloadFunc)

  if (statusEnterRoom.value) {
    await exitRoom()
  }

  await webrtcStore.close()

  // mediaStream 削除
  switch (videoMode.value) {
    case 'normal': mediaStreamNormalStore.closeMediaStream(); break
    case 'alt-text': mediaStreamAltTextStore.closeMediaStream(); break
    case 'blur': mediaStreamBlurStore.closeMediaStream(); break
    case 'image': mediaStreamVbgStore.closeMediaStream(); break
  }
}
onBeforeUnmount(endRoom)
// beforeunload
const unloadFunc = async () => {
  await endRoom()
}

webrtcStore.peerOnCallCallback = async (options: any) => {
  // console.info('----- webrtcStore.peerOnCallCallback() -----')
  if (options.peer_id) {
    // console.info('options.peer_id', options.peer_id)
    // Spearkerモード時のターゲットに設定
    targetSpeakerPeerId.value = options.peer_id
  }
}

webrtcStore.peerOnErrorCallback = async (options: any) => {
  // console.info('----- webrtcStore.peerOnErrorCallback() -----')
  if (options.type) {
    // console.info('options.type   :', options.type)
    // console.info('options.peer_id:', options.peer_id)
    if (options.type === 'peer-unavailable') {
      // 接続できなかった peer_id 要素を削除後、Speakerモードの target を再設定
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
  }
}

webrtcStore.mediaConnOnCloseCallback = async (/* options: any */) => {
  // console.info('----- webrtcStore.mediaConnOnCloseCallback() -----')
  // if (options) {
  //   console.info('options.peer_id:', options.peer_id)
  // }

  // 接続を切断した peer_id 要素を削除後、Speakerモードの target を再設定
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

// Roomへの入室
const enterRoom = async () => {
  if (webrtcStore.myPeerId === '') {
    console.error('no my peer id.')
    throw new Error('no my peer id.')
  }

  // init.
  // MediaStream 設定
  webrtcStore.myMediaStream = mediaStream.value
  // 表示名
  mediaStreamAltTextStore.altText = webrtcStore.myName = myDisplayName.value
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

  // Speakerモードの Target User 自動選択への対応
  cIId2 = setInterval(() => {
    getTargetUser()
  }, 1000)

  // 状態: 入室
  statusEnterRoom.value = true
}

// Roomからの退室
const exitRoom = async (options: any = {}) => {
  // 状態: 退室
  statusEnterRoom.value = false

  if (cIId !== null) {
    clearInterval(cIId)
    cIId = null
  }
  if (cIId2 !== null) {
    clearInterval(cIId2)
    cIId2 = null
  }

  targetSpeakerPeerId.value = webrtcStore.myPeerId

  // 退室APIアクセス
  await roomStore.exitRoom(roomHash.value, webrtcStore.myPeerId)

  // WebRTC - 退出
  webrtcStore.disconnectMedia()

  if (options.alertMessage) {
    textAlertMessage.value = options.alertMessage
    textAlertType.value = options.alertType
    modalAlertMessage.value.open()
  }
}

// PeerConn 状態をチェック、改善処理
const checkStatusPeerConn = async () => {
  // status
  const res = await roomStore.statusRoom(roomHash.value)
  webrtcStore.checkMedias(res)
}

// 音声出力の大きなUserの Peer ID を取得
const getTargetUser = () => {
  const maxVolumePeerData = webrtcStore.getTargetUserPeerId()
  if (
    maxVolumePeerData.volume > VOLUME_VALID_VALUE &&
    maxVolumePeerData.peerId !== webrtcStore.myPeerId
  ) {
    // volume値がある程度あるなら、ターゲットを変更
    targetSpeakerPeerId.value = maxVolumePeerData.peerId
  }
}

// バーチャル背景 mediaStream 切替
const changeVideoMode = async () => {
  // 既存mediaStream から Video を入れ替え
  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })
  switch (videoModeData.value[videoModeBefore.value].type) {
    case 'normal': mediaStreamNormalStore.closeMediaStream('video'); break
    case 'alt-text': mediaStreamAltTextStore.closeMediaStream('video'); break
    case 'blur': mediaStreamBlurStore.closeMediaStream('video'); break
    case 'image': mediaStreamVbgStore.closeMediaStream('video'); break
  }

  switch (videoModeData.value[videoMode.value].type) {
    case 'normal':
      // Normal のVideoトラックを mediaStream に追加
      await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ; (mediaStreamNormalStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      // video on/off switch => ON
      trackStatus.value.video = true
      break
    case 'alt-text':
      // AltText のVideoトラックを mediaStream に追加
      mediaStreamAltTextStore.openMediaStream()
      ; (mediaStreamAltTextStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      // video on/off switch => OFF
      trackStatus.value.video = false
      break
    case 'blur':
      mediaStreamBlurStore.backgroundBlur = videoModeData.value[videoMode.value].blur
      mediaStreamBlurStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamBlurStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      // video on/off switch => ON
      trackStatus.value.video = true
      break
    case 'image':
      mediaStreamVbgStore.bgImageUrl = videoModeData.value[videoMode.value].url
      mediaStreamVbgStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamVbgStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      // video on/off switch => ON
      trackStatus.value.video = true
      break
  }

  // 通信中は PeerConnection の Video トラックを置き換え
  if (statusEnterRoom.value) {
    webrtcStore.replaceVideoTrackToPeerConnection(mediaStream.value)
  }

  videoModeBefore.value = videoMode.value
}

// video on/off
const toggleVideo = async () => {
  // 既存mediaStream から Video を入れ替え
  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })
  switch (videoModeData.value[videoMode.value].type) {
    case 'normal': mediaStreamNormalStore.closeMediaStream('video'); break
    case 'alt-text': mediaStreamAltTextStore.closeMediaStream('video'); break
    case 'blur': mediaStreamBlurStore.closeMediaStream('video'); break
    case 'image': mediaStreamVbgStore.closeMediaStream('video'); break
  }

  // 値の更新
  if (videoMode.value === 'alt-text') {
    // altText -> normal or ...
    videoMode.value = videoModeTmp.value
    trackStatus.value.video = true
  } else {
    // normal or ... -> altText
    videoModeTmp.value = videoMode.value
    videoMode.value = 'alt-text'
    trackStatus.value.video = false
  }

  switch (videoModeData.value[videoMode.value].type) {
    case 'normal':
      await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamNormalStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'alt-text':
      mediaStreamAltTextStore.openMediaStream()
      ;(mediaStreamAltTextStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'blur':
      mediaStreamBlurStore.backgroundBlur = videoModeData.value[videoMode.value].blur
      mediaStreamBlurStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamBlurStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'image':
      mediaStreamVbgStore.bgImageUrl = videoModeData.value[videoMode.value].url
      mediaStreamVbgStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamVbgStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
  }

  // 通信中は PeerConnection の Video トラックを置き換え
  if (statusEnterRoom.value) {
    webrtcStore.replaceVideoTrackToPeerConnection(mediaStream.value)
  }

  videoModeBefore.value = videoMode.value
}

// audio on/off
const toggleAudio = () => {
  trackStatus.value.audio = !trackStatus.value.audio

  mediaStream.value.getAudioTracks().forEach((tr) => {
    tr.enabled = trackStatus.value.audio
  })

  // 通信中は PeerConnection の Audio トラックを変更
  if (statusEnterRoom.value) {
    webrtcStore.changeAudioEnabledToPeerConnection(trackStatus.value.audio)
  }
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

// [スマートフォン]: settings: 設定ダイアログ
const selectedTabSp = ref<'' | 'chat' | 'settings' | 'virtual-background'>('chat')
// [スマートフォン]: 設定ダイアログ: ダイアログを開く
const openSettingsSp = (selected: '' | 'chat' | 'settings' | 'virtual-background') => {
  // デバイス一覧 更新
  mediaDeviceStore.makeDeviceList()

  // tab選択
  selectedTabSp.value = selected

  // 設定ダイアログを開く
  modalSettings.value.open()
}
// [スマートフォン]: 設定ダイアログ: タブを選択
const selectSettingsSp = (value: '' | 'chat' | 'settings' | 'virtual-background') => {
  selectedTabSp.value = value

  if (selectedTabSp.value === 'settings') {
    mediaDeviceStore.makeDeviceList()
  }
}

// [Tablet / PC]: settings: 右サイド・設定欄 : '' | 'chat' | 'settings' | 'virtual-background'
const selectedTabPc = ref<'' | 'chat' | 'settings' | 'virtual-background'>('')
// [Tablet / PC]: 設定ダイアログ: タブを選択
const selectSettingsPc = (
  value: '' | 'chat' | 'settings' | 'virtual-background',
  selectFrom: 'rightside-menu' | 'meeting-controller' = 'rightside-menu'
) => {
  if (selectFrom === 'meeting-controller') {
    if (selectedTabPc.value === '') {
      selectedTabPc.value = 'settings'
    } else {
      selectedTabPc.value = ''
    }
  } else {
    selectedTabPc.value = value
    if (selectedTabPc.value === 'settings') {
      mediaDeviceStore.makeDeviceList()
    }
  }
}

// 設定ダイアログ: Video入力 切替
const changeVideoInput = async () => {
  // close the video mediastream
  // 既存mediaStream から Video を入れ替え
  mediaStream.value.getVideoTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  // device 切替 - Video Input
  mediaDeviceStore.mediaStreamConstraints.video.deviceId = mediaDeviceStore.videoInputDeviceId

  // mediastream 再起動
  switch (videoModeData.value[videoMode.value].type) {
    case 'normal':
      mediaStreamNormalStore.closeMediaStream('video')
      await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
      ;(mediaStreamNormalStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'alt-text':
      mediaStreamAltTextStore.closeMediaStream('video')
      mediaStreamAltTextStore.openMediaStream()
      ;(mediaStreamAltTextStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'blur':
      mediaStreamBlurStore.backgroundBlur = videoModeData.value[videoMode.value].blur
      mediaStreamBlurStore.closeMediaStream('video')
      await mediaStreamBlurStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints);
      ;(mediaStreamBlurStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
    case 'image':
      mediaStreamVbgStore.bgImageUrl = videoModeData.value[videoMode.value].url
      mediaStreamVbgStore.closeMediaStream('video')
      await mediaStreamVbgStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints);
      ;(mediaStreamVbgStore.getMediaStream() as MediaStream).getVideoTracks().forEach((tr) => {
        mediaStream.value.addTrack(tr)
      })
      break
  }

  // 通信中は PeerConnection の Video トラックを置き換え
  if (statusEnterRoom.value) {
    webrtcStore.replaceVideoTrackToPeerConnection(mediaStream.value)
  }
}

// 設定ダイアログ: Audio入力 切替
const changeAudioInput = async () => {
  // close the video mediastream
  mediaStream.value.getAudioTracks().forEach((tr) => {
    tr.stop()
    mediaStream.value.removeTrack(tr)
  })

  // device 切替 - Audio Input
  mediaDeviceStore.mediaStreamConstraints.audio.deviceId = mediaDeviceStore.audioInputDeviceId

  // mediastream 再起動
  mediaStreamNormalStore.closeMediaStream('audio')
  await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
  ;(mediaStreamNormalStore.getMediaStream() as MediaStream).getAudioTracks().forEach((tr) => {
    mediaStream.value.addTrack(tr)
  })

  // 通信中は PeerConnection の Audio トラックを置き換え
  if (statusEnterRoom.value) {
    webrtcStore.replaceAudioTrackToPeerConnection(mediaStream.value)
  }
}

// 表示名を変更
const changeDisplayName = () => {
  // 表示名を更新
  webrtcStore.myName = mediaStreamAltTextStore.altText = myDisplayName.value

  // webrtcStore.peerMedias[myPeerId].displayName を更新
  Object.keys(webrtcStore.peerMedias).forEach((sKey: string) => {
    if (sKey === webrtcStore.myPeerId) {
      webrtcStore.peerMedias[sKey].displayName = myDisplayName.value
    }
  })

  // 相手へ送信
  webrtcStore.sendMyNameToAll()
}

const doReload = () => {
  location.reload()
}
</script>

<template>
  <template v-if="statusEnterRoom === false">
    <div class="bg-slate-100 pb-10">
      <!-- 入室前状態 -->

      <VccHeader />
      <div class="container mx-auto">
        <div class="p-3">
          <video
            class="max-h-80 w-full mx-auto bg-slate-100"
            :class="{ 'my-video-mirrored': myVideoMirrored && videoMode !== 'alt-text' }"
            :srcObject.prop="mediaStream"
            autoplay
            muted
            playsinline
          ></video>
          <audio
            :srcObject.prop="mediaStream"
            autoplay
            playsinline
          ></audio>
          <!--
          -->

          <div class="flex w-full justify-between">
            <div class="my-3 flex items-center justify-center">
              <!-- 戻る -->
              <ButtonGeneralSecondary class="me-2 h-12 w-20" @click="toTopPage">
                &lt;&lt; 戻る
              </ButtonGeneralSecondary>
              <!-- // 戻る -->
            </div>

            <div class="my-3 flex items-center justify-center">
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
                <template #explain>カメラ ON/OFF</template>
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
                <template #explain>マイク ON/OFF</template>
              </ButtonGeneralPrimary>
              <!-- // mic on/off -->

              <!-- 設定 -->
              <ButtonGeneralPrimary class="me-1 h-12 w-12 px-0" @click="openSettingsSp('settings')">
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
                <template #explain>設定</template>
              </ButtonGeneralPrimary>
              <!-- // 設定 -->
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

      <!-- xs: スマートフォン -->
      <div class="mx-auto h-screen w-screen bg-slate-800 sm:hidden">
        <!-- main -->
        <div class="main flex justify-start">
          <div class="sp relative w-full">
            <!-- ViewMode: Speaker -->
            <div class="speaker-view" v-if="viewMode === 'speaker'">
              <div
                class="target-speaker relative flex flex-wrap justify-center bg-slate-800"
                v-if="targetSpeakerPeerId !== ''"
              >
                <template v-if="webrtcStore.peerMedias[targetSpeakerPeerId].available">
                  <video
                    class="h-full w-full"
                    :class="{
                      'my-video-mirrored':
                        myVideoMirrored &&
                        videoMode !== 'alt-text' &&
                        webrtcStore.peerMedias[targetSpeakerPeerId].peerId === webrtcStore.myPeerId
                    }"
                    :srcObject.prop="webrtcStore.peerMedias[targetSpeakerPeerId].mediaStream"
                    autoplay
                    muted
                    playsinline
                  ></video>
                  <div
                    class="absolute bottom-0 left-0 z-10 rounded-md bg-black p-3 text-xl font-bold text-white"
                  >
                    <div class="flex items-center justify-start">
                      <div class="">
                        {{ webrtcStore.peerMedias[targetSpeakerPeerId].displayName }}
                      </div>
                      <div
                        class=""
                        v-if="
                          webrtcStore.peerMedias[targetSpeakerPeerId].volume > VOLUME_VALID_VALUE
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-soundwave"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <div class="speakers w-screen overflow-x-auto">
                <div class="speakers__list flex flex-nowrap justify-start">
                  <template v-for="pm in webrtcStore.peerMedias" :key="pm.peerId">
                    <div
                      class="speakers__list__item flex items-center"
                      @click="chooseSpeaker(pm.peerId)"
                      v-if="pm.available"
                    >
                      <video
                        class="p-1"
                        :class="{
                          'my-video-mirrored':
                            myVideoMirrored &&
                            videoMode !== 'alt-text' &&
                            pm.peerId === webrtcStore.myPeerId
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
                        class="speakers__list__item--label flex items-center justify-start bg-black text-xs font-bold text-white"
                      >
                        <div class="">{{ webrtcStore.peerMedias[pm.peerId].displayName }}</div>
                        <div
                          class=""
                          v-if="webrtcStore.peerMedias[pm.peerId].volume > VOLUME_VALID_VALUE"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            class="bi bi-soundwave"
                            viewBox="0 0 16 16"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <!-- // ViewMode: Speaker -->

            <!-- ViewMode: Matrix -->
            <div class="matrix-view" v-else-if="viewMode === 'matrix'">
              <template v-for="(pm, peerId) in webrtcStore.peerMedias" :key="peerId">
                <div
                  class="matrix-view__item flex items-center border border-slate-900"
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
                  v-if="pm.available"
                >
                  <video
                    class="h-full w-full"
                    :class="{
                      'my-video-mirrored':
                        myVideoMirrored &&
                        videoMode !== 'alt-text' &&
                        pm.peerId === webrtcStore.myPeerId
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
                    class="matrix-view__item__label flex items-center justify-start bg-black text-xl text-white"
                  >
                    <div class="">{{ webrtcStore.peerMedias[pm.peerId].displayName }}</div>
                    <div
                      class=""
                      v-if="webrtcStore.peerMedias[pm.peerId].volume > VOLUME_VALID_VALUE"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-soundwave"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <!-- // ViewMode: Matrix -->
          </div>
        </div>
        <!-- // main -->

        <!-- footer -->
        <div class="footer">
          <MeetingController
            :viewMode="viewMode"
            :trackStatusVideo="trackStatus.video"
            :trackStatusAudio="trackStatus.audio"
            @change-view-mode="changeViewMode"
            @toggle-video="toggleVideo"
            @toggle-audio="toggleAudio"
            @exit-room="exitRoom"
            @open-settings="openSettingsSp('settings')"
          />
        </div>
        <!-- // footer -->
      </div>
      <!-- // xs: スマートフォン -->

      <!-- sm: タブレット、パソコン -->
      <div class="mx-auto hidden h-screen w-screen bg-slate-800 sm:block">
        <!-- main -->
        <div class="main flex justify-start">
          <div
            class="pc relative"
            style="border: 0px red dashed"
            :class="{ 'pc-full': selectedTabPc === '' }"
          >
            <!-- ViewMode: Speaker -->
            <div class="speaker-view" v-if="viewMode === 'speaker'">
              <div
                class="target-speaker flex flex-wrap justify-center"
                v-if="targetSpeakerPeerId !== ''"
              >
                <template v-if="webrtcStore.peerMedias[targetSpeakerPeerId].available">
                  <video
                    class="h-full w-full"
                    :class="{
                      'my-video-mirrored':
                        myVideoMirrored &&
                        videoMode !== 'alt-text' &&
                        webrtcStore.peerMedias[targetSpeakerPeerId].peerId === webrtcStore.myPeerId
                    }"
                    :srcObject.prop="webrtcStore.peerMedias[targetSpeakerPeerId].mediaStream"
                    autoplay
                    muted
                    playsinline
                  ></video>
                  <div
                    class="absolute bottom-0 left-0 z-10 rounded-md bg-black text-xl font-bold text-white"
                  >
                    <div class="flex items-center justify-start">
                      <div class="">
                        {{ webrtcStore.peerMedias[targetSpeakerPeerId].displayName }}
                      </div>
                      <div
                        class=""
                        v-if="
                          webrtcStore.peerMedias[targetSpeakerPeerId].volume > VOLUME_VALID_VALUE
                        "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-soundwave"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <!-- // current speaker -->

              <!-- speakers list -->
              <div class="speakers border-2 border-slate-900">
                <div class="speakers__list flex flex-nowrap items-center justify-start">
                  <template v-for="pm in webrtcStore.peerMedias" :key="pm.peerId">
                    <div
                      class="speakers__list__item flex items-center"
                      @click="chooseSpeaker(pm.peerId)"
                      v-if="pm.available"
                    >
                      <video
                        class="h-24 border border-slate-700"
                        :class="{
                          'my-video-mirrored':
                            myVideoMirrored &&
                            videoMode !== 'alt-text' &&
                            pm.peerId === webrtcStore.myPeerId
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
                        class="speakers__list__item--label flex items-center justify-start bg-black text-xs text-white"
                      >
                        <div class="">{{ webrtcStore.peerMedias[pm.peerId].displayName }}</div>
                        <div
                          class=""
                          v-if="webrtcStore.peerMedias[pm.peerId].volume > VOLUME_VALID_VALUE"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            class="bi bi-soundwave"
                            viewBox="0 0 16 16"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <!-- // speakers list -->
            </div>
            <!-- // ViewMode: Speaker -->

            <!-- ViewMode: Matrix -->
            <div class="matrix-view" v-else-if="viewMode === 'matrix'">
              <div class="matrix-view__items flex flex-wrap items-center justify-center">
                <template v-for="(pm, peerId) in webrtcStore.peerMedias" :key="peerId">
                  <div
                    class="matrix-view__items__item flex items-center justify-center border border-slate-700"
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
                    v-if="pm.available"
                  >
                    <video
                      class="h-full w-full"
                      :class="{
                        'my-video-mirrored':
                          myVideoMirrored &&
                          videoMode !== 'alt-text' &&
                          pm.peerId === webrtcStore.myPeerId
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
                      class="matrix-view__items__item__label flex items-center justify-start bg-black text-xl text-white"
                    >
                      <div class="">{{ webrtcStore.peerMedias[pm.peerId].displayName }}</div>
                      <div
                        class=""
                        v-if="webrtcStore.peerMedias[pm.peerId].volume > VOLUME_VALID_VALUE"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-soundwave"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M8.5 2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5m-2 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5m-6 1.5A.5.5 0 0 1 5 6v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m8 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m-10 1A.5.5 0 0 1 3 7v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5m12 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0V7a.5.5 0 0 1 .5-.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <!-- // ViewMode: Matrix -->
          </div>

          <!-- Rightside -->
          <div class="rightside overflow-y-auto bg-slate-50" v-if="selectedTabPc !== ''">
            <div class="rightside__contents">
              <template v-if="selectedTabPc === 'chat'">
                <div class="h-full w-full">
                  <TextChat />
                </div>
              </template>

              <template v-else-if="selectedTabPc === 'settings'">
                <div class="h-full w-full overflow-y-auto">
                  <div class="m-0 p-3 font-bold">設定</div>
                  <SettingParts
                    class="mx-3"
                    v-model:my-video-mirrored="myVideoMirrored"
                    v-model:my-display-name="myDisplayName"
                    @change-video-input="changeVideoInput"
                    @change-audio-input="changeAudioInput"
                    @change-display-name="changeDisplayName"
                  />
                </div>
              </template>

              <!-- 背景設定 -->
              <template v-else-if="selectedTabPc === 'virtual-background'">
                <div class="h-full w-full">
                  <div class="m-0 p-3 font-bold">バーチャル背景 設定</div>
                  <div style="height: calc(100% - 50px)">
                    <SelectVirtualBackground
                      class="px-5"
                      :videoModeData="videoModeData"
                      v-model="videoMode"
                      @change="changeVideoMode"
                    />
                  </div>
                </div>
              </template>
              <!-- // 背景設定 -->
            </div>
            <div class="rightside__menu">
              <RightsideMenu
                :selected="selectedTabPc"
                @open-chat="selectSettingsPc('chat', 'rightside-menu')"
                @open-settings="selectSettingsPc('settings', 'rightside-menu')"
                @open-bg="selectSettingsPc('virtual-background', 'rightside-menu')"
              />
            </div>
          </div>
          <!-- // Rightside -->
        </div>
        <!-- // main -->

        <!-- footer -->
        <div class="footer">
          <MeetingController
            :viewMode="viewMode"
            :trackStatusVideo="trackStatus.video"
            :trackStatusAudio="trackStatus.audio"
            @change-view-mode="changeViewMode"
            @toggle-video="toggleVideo"
            @toggle-audio="toggleAudio"
            @exit-room="exitRoom"
            @open-settings="selectSettingsPc('settings', 'meeting-controller')"
          />
        </div>
        <!-- // footer -->
      </div>
      <!-- // sm: タブレット、パソコン -->

      <!-- // 入室(meeting)状態 -->
    </div>
  </template>

  <ModalGeneral ref="modalSendInvitaionSuccess">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">招待メール</div>
        <div class="m-3">送信しました。</div>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalFailureGettingUserMedia">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">お願い</div>
        <div class="m-3">カメラとマイクの使用を許可してください。</div>
        <ButtonGeneralPrimary class="h-12 w-24" @click="doReload"> OK </ButtonGeneralPrimary>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalAlertMessage">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">{{ textAlertType }}</div>
        <div class="m-3">{{ textAlertMessage }}</div>
        <ButtonGeneralPrimary class="h-12 w-24" @click="modalAlertMessage.close()">
          OK
        </ButtonGeneralPrimary>
      </div>
    </div>
  </ModalGeneral>

  <!-- [スマートフォン]: チャット／設定／背景 ダイアログ -->
  <ModalGeneral ref="modalSettings">
    <div class="common-dialog w-80 p-3 sm:w-[37.5rem]">
      <div class="common-dialog__contents">
        <template v-if="selectedTabSp === 'chat'">
          <TextChat />
        </template>
        <template v-else-if="selectedTabSp === 'settings'">
          <div class="h-full w-full">
            <div class="m-0 p-3 font-bold">設定</div>
            <div style="height: calc(100% - 60px); overflow-y: auto">
              <SettingParts
                v-model:my-video-mirrored="myVideoMirrored"
                v-model:my-display-name="myDisplayName"
                @change-video-input="changeVideoInput"
                @change-audio-input="changeAudioInput"
                @change-display-name="changeDisplayName"
              />
            </div>
          </div>
        </template>
        <template v-else-if="selectedTabSp === 'virtual-background'">
          <div class="text-center font-bold">バーチャル背景 設定</div>
          <div
            class="h-96 w-full overflow-y-auto border border-black bg-slate-200 p-0"
            style="height: calc(100% - 26px)"
          >
            <SelectVirtualBackground
              :videoModeData="videoModeData"
              v-model="videoMode"
              @change="changeVideoMode"
            />
          </div>
        </template>
      </div>
      <div class="common-dialog__footer mt-3">
        <RightsideMenu
          :selected="selectedTabSp"
          @open-chat="selectSettingsSp('chat')"
          @open-settings="selectSettingsSp('settings')"
          @open-bg="selectSettingsSp('virtual-background')"
        />

        <div class="my-2 text-center">
          <ButtonGeneralPrimary class="" @click="modalSettings.close()">
            close
          </ButtonGeneralPrimary>
        </div>
      </div>
    </div>
  </ModalGeneral>
  <!-- // [スマートフォン]: チャット／設定／背景 ダイアログ -->
</template>

<style scoped lang="scss">
$footerHeight: 64px;

.main {
  width: 100%;
  height: calc(100vh - $footerHeight);
}
.footer {
  height: $footerHeight;
}

.pc {
  width: calc(100vw - 374px - 0px);
  height: 100%;
  background-color: black;

  .speaker-view {
    .target-speaker {
      height: calc(100vh - (72px + 28px) - $footerHeight);
      position: relative;
    }

    .speakers {
      width: 100%;
      overflow-x: auto;

      .speakers__list {
        width: calc(128px * v-bind(numOfPeers));
        overflow-x: hidden;

        .speakers__list__item {
          width: 128px;
          height: calc(72px + 28px);
          padding: 2px;
          position: relative;

          .speakers__list__item--label {
            border-radius: 5px;
            padding: 3px 5px;
            position: absolute;
            bottom: 0;
            left: 0;
            z-index: 10;
          }
        }
      }
    }
  }

  .matrix-view {
    .matrix-view__items {
      height: calc(100vh - $footerHeight);

      .matrix-view__items__item {
        position: relative;

        .matrix-view__items__item__label {
          border-radius: 5px;
          padding: 3px 5px;
          position: absolute;
          bottom: 0;
          left: 0;
          z-index: 10;
        }
      }
    }
  }
}
.pc-full {
  width: 100vw;
}

.rightside {
  width: 374px;
  height: 100%;
  z-index: 100;

  &__contents {
    height: calc(100% - 43px);
  }
  &__menu {
    height: 42px;
    overflow: hidden;
  }
}

.sp {
  .speaker-view {
    .target-speaker {
      height: calc(100vh - (72px + 28px) - $footerHeight);
      position: relative;
    }

    .speakers {
      width: 100%;
      overflow-x: auto;

      .speakers__list {
        width: calc(128px * v-bind(numOfPeers));
        overflow-x: hidden;

        .speakers__list__item {
          width: 128px;
          height: calc(72px + 28px);
          padding: 2px;
          position: relative;

          .speakers__list__item--label {
            border-radius: 5px;
            padding: 3px 5px;
            position: absolute;
            bottom: 0;
            left: 0;
            z-index: 10;
          }
        }
      }
    }
  }

  .matrix-view {
    height: calc(100vh - $footerHeight);

    .matrix-view__item {
      position: relative;

      .matrix-view__item__label {
        border-radius: 5px;
        padding: 3px 5px;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 10;
      }
    }
  }
}

.my-video-mirrored {
  transform: scaleX(-1);
}

.common-dialog {
  height: 80vh;

  &__contents {
    height: calc(100% - 100px);
    overflow-y: auto;
  }
  &__footer {
    height: 100px;
  }
}
</style>
