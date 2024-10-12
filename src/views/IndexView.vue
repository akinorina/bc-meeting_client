<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import InputText from '@/components/ui/InputText.vue';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';

const router = useRouter()

const room_hash = ref('56oa-co0j-4wal') // ToDo: 実際は空文字にする

const joinRoom = async () => {
  console.log('--- joinRoom() ---')
  console.log('room_hash', room_hash.value)
  router.push({ name: 'room', params: { room_hash: room_hash.value }})
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <div class="text-xs">
        <h2 class="text-2xl">vc-contact</h2>
        <div class="">
          ビデオ通話、および、テキストチャット Webアプリです。
        </div>

        <div class="my-5">
          <h3 class="font-bold">参加者</h3>
          <div class="">ビデオ通話、および、テキストチャットへのRoomハッシュを入力して参加ボタンを押下してください。</div>
          <InputText class="" v-model="room_hash" /> <ButtonGeneral class="" @click="joinRoom">参加</ButtonGeneral>
        </div>

        <div class="my-5">
          <h3 class="font-bold">Room作成するには・・・</h3>
          <div class="">
            ビデオ通話、および、テキストチャットをするための Room を作成するには、アカウントを作成して、
            <RouterLink :to="{ name: 'sign-in' }">サインイン</RouterLink> する必要があります。
          </div>
          <div class="my-3">
            <ButtonGeneral class="" @click="router.push({ name: 'mypage' })">
              my page へ進む
            </ButtonGeneral>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
