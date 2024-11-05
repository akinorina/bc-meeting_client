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

    <div class="border">
      <div class="p-3 text-center">
        <div class="font-bold">bc-meeting ユーザー登録</div>
        <div class="">ユーザー登録が完了しました。</div>
      </div>

      <div class="p-3 text-center">
        <ButtonGeneralPrimary class="" @click="toSignin">サインイン</ButtonGeneralPrimary>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
