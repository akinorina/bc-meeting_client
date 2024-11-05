<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/rooms'
import ModalGeneral from '@/components/ModalGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import ButtonGeneralDanger from '@/components/ui/ButtonGeneralDanger.vue'
import InputText from '@/components/ui/InputText.vue'
import VccHeader from '@/components/VccHeader.vue'

const router = useRouter()
const roomStore = useRoomStore()

const modal1 = ref()
const modal1status = ref('')
const modal1tid = ref<any>()
const modal2 = ref()
const modal2status = ref('')
const modal2tid = ref<any>()

onMounted(() => {
  roomStore.getRooms()
})

// Room新規作成 init()
const createRoomInit = async () => {
  await roomStore.newRoom()
  modal1status.value = 'input'
  modal1.value.open()
}
// Room新規作成 submit()
const createRoomSubmit = async () => {
  await roomStore.createRoom()
  modal1status.value = 'complete'

  await roomStore.getRooms()
  modal1tid.value = setTimeout(() => {
    modal1.value.close()
  }, 2000)
}
const clearTimeoutModal1 = () => {
  clearTimeout(modal1tid.value)
  return false
}

// Room編集 init()
const editRoomInit = async (id: number) => {
  await roomStore.getRoom(id)

  modal2status.value = 'input'
  modal2.value.open()
}
// Room編集 submit()
const editRoomSubmit = async () => {
  await roomStore.updateRoom(roomStore.room.id)
  modal2status.value = 'complete'

  await roomStore.getRooms()
  modal2tid.value = setTimeout(() => {
    modal2.value.close()
  }, 2000)
}
const clearTimeoutModal2 = () => {
  clearTimeout(modal2tid.value)
  return false
}

// Room編集 delete_confirm()
const deleteRoomConfirm = async () => {
  modal2status.value = 'delete_confirm'
}
// Room編集 delete_submit()
const deleteRoomSubmit = async () => {
  await roomStore.deleteRoom(roomStore.room.id)
  modal2status.value = 'delete_complete'

  await roomStore.getRooms()
  modal2tid.value = setTimeout(() => {
    modal2.value.close()
  }, 2000)
}
//
const contactRoom = async (roomHash: string) => {
  router.push({ name: 'room', params: { room_hash: roomHash } })
}
</script>

<template>
  <div class="container mx-auto w-screen bg-inherit">
    <VccHeader />

    <div class="h-18 p-1">
      <div class="font-bold">Contact Rooms</div>
      <div class="text-sm">ビデオチャット、テキストチャットのRoom一覧</div>
    </div>

    <!-- Rooms一覧 -->
    <div class="overflow-scroll bg-inherit py-3">
      <div v-if="roomStore.rooms.length === 0">
        <div class="p-5">あなたの Room はありません。</div>
      </div>
      <div
        class="w-100 mx-3 mb-3 rounded-lg border bg-white p-3"
        v-for="item in roomStore.rooms"
        :key="item.id"
      >
        <div class="my-1">
          <div class="overflow-hidden text-lg font-bold">{{ item.room_name }}</div>
        </div>
        <div class="flex items-end justify-between">
          <div class="">{{ item.room_hash }}</div>
          <div class="flex">
            <ButtonGeneralPrimary class="me-2" @click="contactRoom(item.room_hash)"
              >詳細</ButtonGeneralPrimary
            >
            <ButtonGeneralPrimary class="me-0" @click="editRoomInit(item.id)"
              >編集</ButtonGeneralPrimary
            >
          </div>
        </div>
      </div>
    </div>
    <!-- // Rooms一覧 -->

    <div class="h-16 bg-inherit" />
  </div>

  <!-- menu -->
  <div class="fixed bottom-0 w-screen bg-slate-200 p-3">
    <div class="flex justify-between">
      <ButtonGeneralPrimary class="rounded-3xl border p-2" @click="createRoomInit">
        <div class="flex flex-col items-center">
          <div class="font-bold">Room作成</div>
        </div>
      </ButtonGeneralPrimary>

      <ButtonGeneralPrimary
        class="rounded-3xl border p-2"
        @click="router.push({ name: 'mypage_settings' })"
      >
        <div class="flex flex-col items-center">
          <div class="font-bold">設定</div>
        </div>
      </ButtonGeneralPrimary>
    </div>
  </div>
  <!-- // menu -->

  <!-- Modal:Room新規作成 -->
  <ModalGeneral
    ref="modal1"
    :is-close-modal-back="true"
    :close-modal-back-callback="clearTimeoutModal1"
  >
    <div class="h-40 w-80 p-0" v-if="modal1status === 'input'">
      <h3 class="m-3 font-bold">Room 新規作成</h3>
      <div class="mx-3 my-4">
        <div class="py-0">
          <InputText
            class="border"
            style="width: 90%"
            placeholder="Room 名称"
            v-model="roomStore.room.room_name"
          />
        </div>
      </div>
      <div class="m-3 text-center">
        <ButtonGeneralSecondary class="me-3" @click="modal1.close()">中止</ButtonGeneralSecondary>
        <ButtonGeneralPrimary class="me-0" @click="createRoomSubmit">新規作成</ButtonGeneralPrimary>
      </div>
    </div>
    <div class="h-40 w-80 p-0" v-else-if="modal1status === 'complete'">
      <div class="flex h-full items-center justify-center border p-3">Room 新規作成完了</div>
    </div>
  </ModalGeneral>
  <!-- // Modal:Room新規作成 -->

  <!-- Modal:Room編集 -->
  <ModalGeneral
    ref="modal2"
    :is-close-modal-back="true"
    :close-modal-back-callback="clearTimeoutModal2"
  >
    <div class="h-58 w-80 p-0" v-if="modal2status === 'input'">
      <h3 class="m-3 font-bold">Room 編集</h3>
      <div class="m-3">
        <div class="m-3">
          <InputText
            class=""
            style="width: 100%"
            placeholder="Room 名称"
            v-model="roomStore.room.room_name"
          />
        </div>
        <div class="m-3">
          <div class="font-bold">Room hash</div>
          <InputText
            class="border-0"
            style="width: 100%"
            readonly
            v-model="roomStore.room.room_hash"
          />
        </div>
      </div>
      <div class="m-3 text-center">
        <ButtonGeneralSecondary class="me-3" @click.prevent="modal2.close()"
          >中止</ButtonGeneralSecondary
        >
        <ButtonGeneralPrimary class="me-3" @click.prevent="editRoomSubmit"
          >更新</ButtonGeneralPrimary
        >
        <ButtonGeneralDanger class="me-0" @click.prevent="deleteRoomConfirm"
          >削除</ButtonGeneralDanger
        >
      </div>
    </div>
    <div class="h-58 w-80 p-0" v-if="modal2status === 'delete_confirm'">
      <h3 class="m-3 font-bold">Room 編集</h3>
      <div class="m-3">削除しますか？</div>
      <div class="m-3 text-center">
        <ButtonGeneralSecondary class="me-3" @click="modal2status = 'input'"
          >戻る</ButtonGeneralSecondary
        >
        <ButtonGeneralDanger class="me-0" @click.prevent="deleteRoomSubmit"
          >削除</ButtonGeneralDanger
        >
      </div>
    </div>
    <div class="h-40 w-80 p-0" v-else-if="modal2status === 'complete'">
      <div class="flex h-full items-center justify-center border p-3">Room 更新完了</div>
    </div>
    <div class="h-40 w-80 p-0" v-else-if="modal2status === 'delete_complete'">
      <div class="flex h-full items-center justify-center border p-3">Room 削除完了</div>
    </div>
  </ModalGeneral>
  <!-- // Modal:Room編集 -->
</template>

<style scoped lang="scss"></style>
