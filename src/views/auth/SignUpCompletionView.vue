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
    <div class="border">
      <div class="p-3 text-center">
        <div class="font-bold">vc-contact ユーザー登録</div>
        <div class="">ユーザー登録が完了しました。</div>
      </div>

      <div class="p-3 text-center">
        <ButtonGeneral class="" @click="toSignin">サインイン</ButtonGeneral>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
