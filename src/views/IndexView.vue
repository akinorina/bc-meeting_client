<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useImagePublicStore } from '@/stores/imagePublic'
import InputText from '@/components/ui/InputText.vue';
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';

const imagePublicStore = useImagePublicStore()

const room_ash = ref('')

onMounted(() => {
  imagePublicStore.getImages()
})
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
          ビデオ通話、および、テキストチャットへのRoomハッシュを入力して参加ボタンを押下してください。
          <InputText class="" v-model="room_ash" /> <ButtonGeneral class="">参加</ButtonGeneral>
        </div>

        <div class="my-5">
          <h3 class="font-bold">Room作成するには・・・</h3>
          ビデオ通話、および、テキストチャットをするための Room を作成するには、アカウントを作成して、
          <RouterLink :to="{ name: 'sign-in' }">サインイン</RouterLink> する必要があります。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
