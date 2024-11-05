<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import VccHeader from '@/components/VccHeader.vue'

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

    <div class="mt-2 border p-3">
      <h2 class="text-lg font-bold">ユーザー登録</h2>
      <p class="text-base">ユーザー登録が完了しました。</p>
    </div>

    <div class="mt-2 w-full border p-3 text-center">
      <ButtonGeneralPrimary class="" @click="toSignin">サインイン</ButtonGeneralPrimary>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
