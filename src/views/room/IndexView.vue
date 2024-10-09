<script setup lang="ts">
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';
import { useRoomStore } from '@/stores/rooms';
import { onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter()
const route = useRoute()

const room_hash = computed({
  get() {
    return route.params.room_hash.toString() ?? ''
  },
  set(room_hash) {
    router.replace({ params: { room_hash } })
  }
})

const roomStore = useRoomStore()

onMounted(async () => {
  console.log('--- onMounted() ---')
  console.log('room_hash', room_hash.value)

  // Room情報取得
  await roomStore.getRoomByRoomHash(room_hash.value)
  console.info('room', roomStore.room)
})

onBeforeUnmount(async () => {
  console.log('--- onBeforeUnmount() ---')
})

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
    <div class="p-3">
      <ButtonGeneral class="me-2">入室</ButtonGeneral>
      <ButtonGeneral class="me-0">退室</ButtonGeneral>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
