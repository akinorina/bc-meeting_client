<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

// stores
const router = useRouter()

// functions
const toSignin = () => {
  router.push({ name: 'sign-in', params: {} })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="mt-2 border p-3">
      <h2 class="text-lg font-bold">ユーザー登録</h2>
      <p class="text-base">ユーザー登録が完了しました。</p>
    </div>

    <div class="mt-2 border p-3 w-full text-center">
      <ButtonGeneral class="" @click="toSignin">サインイン</ButtonGeneral>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
