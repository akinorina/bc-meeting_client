<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';
import { useRoomStore } from '@/stores/rooms';
import { useWebrtcStore } from '@/stores/webrtc';

const router = useRouter()
const route = useRoute()
const webrtcStore = useWebrtcStore()

const roomHash = computed({
  get() {
    return route.params.room_hash.toString() ?? ''
  },
  set(roomHash) {
    router.replace({ params: { room_hash: roomHash } })
  }
})

const roomStore = useRoomStore()

// my MediaStream video/audio
const trackStatus = ref({ video: true, audio: true })

// 状態: 入室 / 退室
const statusEnterRoom = ref(false)

// check interval ID.
let cIId: any = null

// NotFound (== bad room hash)
const isBadRoomHash = ref<boolean>(false)

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
  await webrtcStore.openMyMediaStream(trackStatus.value)

  // open Peer
  await webrtcStore.open({
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH
  })
})

onBeforeUnmount(async () => {
  if (cIId !== null) {
    clearInterval(cIId)
    cIId = null
  }

  if (statusEnterRoom.value) {
    await exitRoom()
  }

  await webrtcStore.close()

  webrtcStore.closeMyMediaStream()
})

// top page へ遷移
const toTopPage = () => {
  // my page へ遷移
  router.push({ name: 'mypage' })
}

// Roomへの入室
const enterRoom = async () => {
  // 入室APIアクセス
  await roomStore.enterRoom(roomHash.value, webrtcStore.myPeerId)

  // 入室状態を取得
  const res2 = await roomStore.statusRoom(roomHash.value)
  res2.attenders.forEach(async (item: any) => {
    if (item.peer_id !== webrtcStore.myPeerId) {
      // 現在の参加者それぞれへメディア接続
      webrtcStore.connectMedia(item.peer_id)
    }
  })

  // 状態: 入室
  statusEnterRoom.value = true

  // 相手の disconnect 不良への対応
  cIId = setInterval(() => { checkStatusPeerConn() }, 5000)
}

// Roomからの退室
const exitRoom = async () => {
  if (cIId !== null) {
    await clearInterval(cIId)
    cIId = null
  }

  // WebRTC - 退出
  webrtcStore.disconnectMedia()
  // 退室APIアクセス
  await roomStore.exitRoom(roomHash.value, webrtcStore.myPeerId)

  // 状態: 退室
  statusEnterRoom.value = false
}

// PeerConn 状態をチェック、改善処理
const checkStatusPeerConn = async () => {
  // status
  const res = await roomStore.statusRoom(roomHash.value)
  const peerIds: Array<string> = res.attenders.map((item: any) => {
    return item.peer_id
  })
  webrtcStore.checkMedias(peerIds)
}

const toggleVideo = () => {
  webrtcStore.setVideoEnabled(!trackStatus.value.video)
  trackStatus.value.video = !trackStatus.value.video
}

const toggleAudio = () => {
  webrtcStore.setAudioEnabled(!trackStatus.value.audio)
  trackStatus.value.audio = !trackStatus.value.audio
}
</script>

<template>
  <div>
    <template v-if="isBadRoomHash">
      <div class="container mx-auto h-svh p-3 border rounded-xl bg-slate-100">
        <div class="m-2">room ハッシュに誤りがあります。</div>
        <div class="m-2">
          <ButtonGeneral class="" @click="router.push({ name: 'index' })">&lt;&lt; Topページへ戻る</ButtonGeneral>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="h-svh bg-slate-100" v-if="statusEnterRoom === false">
        <div class="w-full">
          <div class="w-full flex items-center p-3">
            <video class="w-full max-h-80 bg-slate-100" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>
          </div>
          <div class="w-full flex justify-center p-3">
            <div class="w-80 border rounded-md p-3 text-center">
              <div class="my-3">
                <div class="text-xl font-semibold">{{ roomStore.room.room_name }}</div>
                <div class="">{{ roomStore.room.room_hash }}</div>
              </div>

              <div class="my-3 flex justify-center items-center">
                <ButtonGeneral class="w-20 h-12 me-1" @click="toTopPage">Topへ</ButtonGeneral>
                <ButtonGeneral class="w-20 h-12 me-1" @click="enterRoom">入室</ButtonGeneral>
                <ButtonGeneral class="w-12 h-12 me-1" @click="toggleVideo">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 20 20" v-if="trackStatus.video">
                    <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 20 20" v-else>
                    <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925-10-14 .814-.58 10 14-.814.58z"/>
                  </svg>
                </ButtonGeneral>
                <ButtonGeneral class="w-12 h-12 me-0" @click="toggleAudio">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 20 20" v-if="trackStatus.audio">
                    <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
                    <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 20 20" v-else>
                    <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
                    <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
                  </svg>
                </ButtonGeneral>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="" v-else>
        <div class="absolute right-3 bottom-3 z-10 rounded-md p-2 bg-slate-200">
          <div class="flex">
            <ButtonGeneral class="w-12 h-12 me-1" @click="toggleVideo">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 20 20" v-if="trackStatus.video">
                <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 20 20" v-else>
                <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925-10-14 .814-.58 10 14-.814.58z"/>
              </svg>
            </ButtonGeneral>

            <ButtonGeneral class="w-12 h-12 me-2" @click="toggleAudio">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 20 20" v-if="trackStatus.audio">
                <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="24" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 20 20" v-else>
                <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
                <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
              </svg>
            </ButtonGeneral>

            <ButtonGeneral class="me-0" @click="exitRoom">退室</ButtonGeneral>
          </div>
        </div>

        <div class="sm:hidden">
          <!-- smart phone view -->

          <div class="w-screen h-svh flex flex-wrap justify-center">
            <div
              class="relative bg-slate-500 border flex items-center"
              :class="{
                'w-full': (0 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3),
                'w-1/2': (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11),
                'w-1/3': (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 14),
                'w-1/4': (15 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 23),
                'w-1/5': (24 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24),
                'h-full': Object.keys(webrtcStore.peerMedias).length == 0,
                'h-1/2': ((1 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 1)),
                'h-1/3': ((2 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 2) || (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 5)),
                'h-1/4': ((3 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3) || (6 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 7) || (15 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 15)),
                'h-1/5': ((8 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 9) || (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 14) || (16 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 19) || (24 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24)),
                'h-1/6': ((10 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11) || (20 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 23)),
              }"
            >
              <video class="w-full h-full" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>
              <div class="absolute right-2 bottom-2">
                {{ webrtcStore.myPeerId }}
              </div>
            </div>

            <div
              class="relative bg-slate-500 border flex items-center"
              :class="{
                'w-full': (0 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3),
                'w-1/2': (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11),
                'w-1/3': (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 14),
                'w-1/4': (15 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 23),
                'w-1/5': (24 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24),
                'h-full': Object.keys(webrtcStore.peerMedias).length == 0,
                'h-1/2': ((1 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 1)),
                'h-1/3': ((2 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 2) || (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 5)),
                'h-1/4': ((3 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3) || (6 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 7) || (15 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 15)),
                'h-1/5': ((8 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 9) || (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 14) || (16 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 19) || (24 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24)),
                'h-1/6': ((10 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11) || (20 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 23)),
              }"
              v-for="(pm, peerId) in webrtcStore.peerMedias" :key="peerId"
            >
              <video class="w-full h-full" :srcObject.prop="pm.mediaStream" autoplay playsinline></video>
              <audio class="" :srcObject.prop="pm.mediaStream" autoplay playsinline></audio>
              <div class="absolute right-2 bottom-2">
                {{ peerId }}
              </div>
            </div>
          </div>

          <!-- // smart phone view -->
        </div>
        <div class="hidden sm:block">
          <!-- tablet & PC view -->

          <div class="w-screen h-svh flex flex-wrap justify-center">
            <!-- local -->
            <div
              class="relative bg-slate-500 border flex items-center"
              :class="{
                'w-full': (Object.keys(webrtcStore.peerMedias).length === 0),
                'w-1/2': (1 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3),
                'w-1/3': (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 8),
                'w-1/4': (9 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 15),
                'w-1/5': (16 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24),
                'h-full': (0 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 1),
                'h-1/2': (2 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 5),
                'h-1/3': (6 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11),
                'h-1/4': (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 19),
                'h-1/5': (20 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24)
              }"
            >
              <video class="w-full h-full" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>
              <div class="absolute right-2 bottom-2">
                {{ webrtcStore.myPeerId }}
              </div>
            </div>

            <!-- remotes -->
            <div
              class="relative bg-slate-500 border flex items-center"
              :class="{
                'w-full': (Object.keys(webrtcStore.peerMedias).length === 0),
                'w-1/2': (1 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 3),
                'w-1/3': (4 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 8),
                'w-1/4': (9 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 15),
                'w-1/5': (16 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24),
                'h-full': (0 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 1),
                'h-1/2': (2 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 5),
                'h-1/3': (6 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 11),
                'h-1/4': (12 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 19),
                'h-1/5': (20 <= Object.keys(webrtcStore.peerMedias).length && Object.keys(webrtcStore.peerMedias).length <= 24)
              }"
              v-for="(pm, peerId) in webrtcStore.peerMedias" :key="peerId"
            >
              <video class="w-full h-full" :srcObject.prop="pm.mediaStream" autoplay playsinline></video>
              <audio class="" :srcObject.prop="pm.mediaStream" autoplay playsinline></audio>
              <div class="absolute right-2 bottom-2">
                {{ peerId }}
              </div>
            </div>
          </div>

          <!-- // tablet & PC view -->
        </div>

      </div>
    </template>
  </div>
</template>

<style scoped lang="scss"></style>
