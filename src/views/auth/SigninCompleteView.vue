<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import VccHeader from '@/components/VccHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const resultStatus = ref(false)

onMounted(async () => {
  // resultStatus.value = await authStore.signInByGoogleRedirect(route.query)
})

const toUserPage = async () => {
  router.push({ name: 'mypage_payment' })
}
const toTop = async () => {
  router.push({ name: 'index' })
}
</script>

<template>
  <div class="container mx-auto">
    <VccHeader />

    <div class="border">
      <div v-if="resultStatus">
        <div class="border p-3">
          <div class="">サインインしました。</div>
          <div class="">Subscription 設定ページへ進んでください。</div>
        </div>

        <div class="border p-3 text-center">
          <ButtonGeneralPrimary class="" @click="toUserPage">Subscription 設定ページ</ButtonGeneralPrimary>
        </div>
      </div>
      <div v-else>
        <div class="border p-3">
          <div class="">Google アカウントでのサインインに失敗しました。</div>
          <div class="">ログインをやり直してください。</div>
        </div>

        <div class="">
          <ButtonGeneralPrimary class="" @click="toTop">Topページ</ButtonGeneralPrimary>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
