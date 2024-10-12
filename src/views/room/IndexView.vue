<script setup lang="ts">
import { onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';
import { useRoomStore } from '@/stores/rooms';
import { useWebrtcStore } from '@/stores/webrtc';
// import Room from '@/lib/Room';
// import RoomAttender from '@/lib/RoomAttender';

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

// // Room データ
// const room = ref<Room>(new Room())
// Room 出席者データ
// const attenders = ref<RoomAttender[]>([])

onMounted(async () => {
  console.log('--- onMounted() ---')
  console.log('roomHash', roomHash.value)

  // Room情報取得
  const res = await roomStore.statusRoom(roomHash.value)
  console.log('res', res)

  console.log('VITE_PEER_SERVER_HOST', import.meta.env.VITE_PEER_SERVER_HOST)
  console.log('VITE_PEER_SERVER_PORT', import.meta.env.VITE_PEER_SERVER_PORT)
  console.log('VITE_PEER_SERVER_PATH', import.meta.env.VITE_PEER_SERVER_PATH)

  // open Peer
  await webrtcStore.open({
    host: import.meta.env.VITE_PEER_SERVER_HOST,
    port: import.meta.env.VITE_PEER_SERVER_PORT,
    path: import.meta.env.VITE_PEER_SERVER_PATH
  })
})

onBeforeUnmount(() => {
  console.log('--- onBeforeUnmount() ---')
  webrtcStore.close()
})

const getRoomStatus = async () => {
  console.log('--- getRoomStatus() ---')
  console.log('roomHash:', roomHash.value)
  const res = await roomStore.statusRoom(roomHash.value)
  console.log('res', res)
}

const enterRoom = async () => {
  console.log('--- enterRoom() ---')

  // 入室APIアクセス
  console.log('roomHash:', roomHash.value)
  const res = await roomStore.enterRoom(roomHash.value, webrtcStore.myPeerId)
  console.log('res', res)

  // 入室状態を取得
  const res2 = await roomStore.statusRoom(roomHash.value)
  res2.attenders.forEach(async (item: any) => {
    console.log('peer_id', item.peer_id)
    if (item.peer_id !== webrtcStore.myPeerId) {
      // 現在の参加者それぞれへメディア接続
      console.log('connect to :', item.peer_id)
      webrtcStore.connectMedia(item.peer_id)
    }
  })
}

const exitRoom = async () => {
  console.log('--- exitRoom() ---')

  // WebRTC - 退出
  webrtcStore.disconnectMedia()

  // 退室APIアクセス
  const res = await roomStore.exitRoom(roomHash.value, webrtcStore.myPeerId)
  console.log('res', res)
}
</script>

<template>
  <div class="container mx-auto h-screen bg-slate-100">
    <div class="border p-3">
      <div class="font-bold">Contact Rooms</div>
      <div class="p-3">
        <div class="">{{ roomStore.room.room_name }}</div>
        <div class="">{{ roomStore.room.room_hash }}</div>
      </div>
    </div>

    <div class="p-3 mt-3 border rounded">
      {{ webrtcStore.myPeerId }}
    </div>

    <div class="p-3">
      <ButtonGeneral class="me-2" @click="getRoomStatus">Room状態</ButtonGeneral>
      <ButtonGeneral class="me-2" @click="enterRoom">入室</ButtonGeneral>
      <ButtonGeneral class="me-2" @click="exitRoom">退室</ButtonGeneral>
      <ButtonGeneral class="me-0" @click.prevent="router.push({ name: 'index' })">Topページへ</ButtonGeneral>
    </div>

    <div class="flex flex-wrap justify-start border">
      <video class="size-60" :srcObject.prop="webrtcStore.myMediaStream" autoplay muted playsinline></video>

      <template v-for="(pm, idx) in webrtcStore.peerMedias" :key="idx">
        <video class="size-60" :srcObject.prop="pm.mediaStream" autoplay muted playsinline></video>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
