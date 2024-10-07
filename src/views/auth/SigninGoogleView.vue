<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const resultStatus = ref(false)

onMounted(async () => {
  resultStatus.value = await authStore.signInByGoogleRedirect(route.query)
})

const toUserPage = async () => {
  router.push({ name: 'admin' })
}
const toTop = async () => {
  router.push({ name: 'index' })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border">
      <div v-if="resultStatus">
        <div class="border p-3">
          <div class="">Google アカウントでサインインしました。</div>
          <div class="">Userページへ進んでください。</div>
        </div>

        <div class="border p-3 text-center">
          <button-general class="" @click="toUserPage">Userページ</button-general>
        </div>
      </div>
      <div v-else>
        <div class="border p-3">
          <div class="">Google アカウントでのサインインに失敗しました。</div>
          <div class="">ログインをやり直してください。</div>
        </div>

        <div class="">
          <button-general class="" @click="toTop">Topページ</button-general>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
