<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import VccHeader from '@/components/VccHeader.vue';

// stores
const router = useRouter()

// functions
const toSignin = () => {
  router.push({ name: 'sign-in', params: {} })
}
</script>

<template>
  <div class="container mx-auto">
    <VccHeader />

    <div class="p-2">
      <h1 class="text-xl font-bold">bc-meeting ユーザー登録</h1>
      <p class="">いただいたメールアドレス宛にメールを送信しました。</p>
      <p>内容をご確認いただき、登録の続きを行なってください。</p>
    </div>

    <div class="p-2">
      <ButtonGeneralPrimary class="rounded-md border px-2 py-1" @click="toSignin">
        サインイン ページへ戻る
      </ButtonGeneralPrimary>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
