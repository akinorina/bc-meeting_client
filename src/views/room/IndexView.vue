<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';
import { useRoomStore } from '@/stores/rooms';
import { useWebrtcStore } from '@/stores/webrtc';
import InputText from '@/components/ui/InputText.vue';

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

// 状態: 入室 / 退室
const statusEnterRoom = ref(false)

// check interval ID.
const cIId = ref<any>(null)

onMounted(async () => {
  // 状態: 退室
  statusEnterRoom.value = false

  // Room 情報取得
  roomStore.getRoomByRoomHash(roomHash.value)

  // open Peer
  await webrtcStore.open({
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH
  })
})

onBeforeUnmount(() => {
  clearInterval(cIId.value)
  webrtcStore.close()
  statusEnterRoom.value = false
})

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
  cIId.value = setInterval(() => { checkStatusPeerConn() }, 5000)
}

const exitRoom = async () => {
  clearInterval(cIId.value)

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

</script>

<template>
  <div class="h-screen bg-slate-100" v-if="statusEnterRoom === false">
    <div class="flex">
      <div class="w-1/2 m-5">
        <video class="w-full bg-slate-100" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>
      </div>
      <div class="w-1/2 m-5 border rounded-md">
        <div class="">
          <div class="p-2 font-bold">Contact Rooms</div>
          <div class="p-2">
            <div class="text-xl font-semibold">{{ roomStore.room.room_name }}</div>
            <div class="">{{ roomStore.room.room_hash }}</div>
          </div>
        </div>

        <div class=" flex justify-start">
          <div class="w-2/6 font-bold p-2">my name.</div>
          <InputText class="w-4/6 px-3 rounded-md" readonly v-model="webrtcStore.myName" />
        </div>

        <div class=" flex justify-start">
          <div class="w-2/6 font-bold p-2">my peer id.</div>
          <InputText class="w-4/6 px-3 rounded-md" readonly v-model="webrtcStore.myPeerId" />
        </div>
        <div class="p-3">
          <ButtonGeneral class="me-2" @click="router.push({ name: 'index' })">Topへ</ButtonGeneral>

          <ButtonGeneral class="me-2" @click="enterRoom">入室</ButtonGeneral>
        </div>
      </div>
    </div>
  </div>
  <div class="" v-else>
    <div class="absolute right-2 bottom-10 z-10 w-32 h-16 rounded-md p-2 bg-slate-200">
      <ButtonGeneral class="" @click="exitRoom">退室</ButtonGeneral>
    </div>
    <div class="w-screen h-screen flex flex-wrap justify-center">
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
        <video class="w-full h-full" :srcObject.prop="pm.mediaStream" autoplay muted playsinline></video>
        <div class="absolute right-2 bottom-2">
          {{ peerId }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
