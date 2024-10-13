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
  <div class="h-screen bg-slate-100">
    <div class="p-3">
      <div class="font-bold">Contact Rooms</div>
      <div class="p-3">
        <div class="">{{ roomStore.room.room_name }}</div>
        <div class="">{{ roomStore.room.room_hash }}</div>
      </div>
    </div>

    <div class=" flex justify-start">
      <div class="w-1/6 font-bold p-2">my name.</div>
      <InputText class="w-3/6 px-3 rounded-md" readonly v-model="webrtcStore.myName" />
    </div>

    <div class=" flex justify-start">
      <div class="w-1/6 font-bold p-2">my peer id.</div>
      <InputText class="w-3/6 px-3 rounded-md" readonly v-model="webrtcStore.myPeerId" />
    </div>

    <div class="p-3">
      <ButtonGeneral class="me-2" @click="router.push({ name: 'index' })">Topページへ</ButtonGeneral>

      <ButtonGeneral class="me-2" @click="enterRoom" v-if="statusEnterRoom === false">入室</ButtonGeneral>
      <ButtonGeneral class="me-2" @click="exitRoom" v-else>退室</ButtonGeneral>
    </div>

    <div class="flex flex-wrap">
      <video class="size-80 bg-slate-100" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>

      <template v-for="(pm, idx) in webrtcStore.peerMedias" :key="idx">
        <video class="size-80 bg-slate-100" :srcObject.prop="pm.mediaStream" autoplay muted playsinline></video>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
