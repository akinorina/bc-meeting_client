<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import InputText from '@/components/ui/InputText.vue';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';

const router = useRouter()

const room_hash = ref('')

const joinRoom = async () => {
  router.push({ name: 'room', params: { room_hash: room_hash.value }})
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <div class="">
        <!-- <h2 class="text-2xl">vc-contact</h2> -->
        <div class="">
          ビデオ通話、および、テキストチャット Webアプリです。
        </div>

        <div class="my-3">
          <h3 class="text-base font-bold">Meeting Room に参加</h3>
          <InputText class="p-1 m-2 text-base" placeholder="例: fe2j-o4f1-qo8h" v-model="room_hash" />
          <ButtonGeneral class="" @click="joinRoom">参加</ButtonGeneral>
          <div class="px-2 pt-1 pb-2 text-xs">ビデオ通話、および、テキストチャットへのRoomハッシュを入力して参加ボタンを押下してください。</div>
        </div>

        <div class="my-3">
          <h3 class="text-base font-bold">Meeting Room の作成</h3>
          <div class="mx-2 my-1">
            <ButtonGeneral class="" @click="router.push({ name: 'mypage' })">
              サインイン
            </ButtonGeneral>
          </div>
          <div class="px-2 pt-1 pb-2 text-xs">
            ビデオ通話をする場である Room を作成するには、アカウントを作成して、
            <RouterLink class="text-blue-700 underline" :to="{ name: 'sign-in' }">サインイン</RouterLink> する必要があります。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
