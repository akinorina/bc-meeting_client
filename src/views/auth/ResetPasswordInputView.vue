<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { AxiosError } from 'axios'
import { digestMessage } from '@/lib/Functions'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import InputPassword from '@/components/ui/InputPassword.vue'

// stores
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const passwordRaw = ref('')
watch(passwordRaw, async (newPasswordRaw) => {
  userStore.newPassword = await digestMessage(newPasswordRaw)
})

const showErrorAlert = ref(false)

// lifecycle
onMounted(() => {
  // QueryString取得
  const queryData: any = route.query

  // 値を初期設定
  userStore.email = queryData.email
  userStore.hash = queryData.hash
  userStore.newPassword = ''
})

// functions
const toIndex = () => {
  router.push({ name: 'index', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.resetPassword()
    router.push({ name: 'reset-password-completion' })
  } catch (err) {
    if (err instanceof AxiosError) {
      showErrorAlert.value = true
      setTimeout(() => {
        showErrorAlert.value = false
      }, 3000)
    }
  }
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <div class="">
        <h1 class="">Webapp4 ユーザー登録</h1>
        <p class="">ユーザー登録ページです。 次の各項目を入力して登録ボタンを押してください。</p>
      </div>
    </div>

    <div v-if="showErrorAlert">
      <div class="">
        <p class="">入力データに不備があります。</p>
      </div>
    </div>

    <div class="border p-3">
      <form class="" novalidate @submit.prevent="submitForm">
        <div class="">
          <div class="">
            <label for="email" class="w-100">Email</label>
            <input-email
              id="email"
              class="w-64"
              placefolder="name@example.com"
              v-model="userStore.unverifiedEmail"
            />
          </div>
          <div class="">
            <label for="password" class="w-100">新しいパスワード</label>
            <input-password
              id="password"
              class="w-64"
              placefolder="password"
              v-model="passwordRaw"
            />
          </div>
        </div>

        <div class="">
          <button-general type="submit" class="m-2 rounded-md border px-2 py-1">
            メールアドレス送信
          </button-general>
          <button-general type="button" class="m-2 rounded-md border px-2 py-1" @click="toIndex">
            Topへ戻る
          </button-general>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
