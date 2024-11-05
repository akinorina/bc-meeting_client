<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import VccHeader from '@/components/VccHeader.vue'

// stores
const router = useRouter()
const userStore = useUserStore()

const showErrorAlert = ref(false)

// lifecycle
onMounted(() => {
  userStore.unverifiedEmail = ''
})

// functions
const toIndex = () => {
  router.push({ name: 'index', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.verifyingEmail('/reset-password-input')
    router.push({ name: 'reset-password-sent-email' })
  } catch (err) {
    if (err instanceof AxiosError) {
      showErrorAlert.value = true
      setTimeout(() => {
        showErrorAlert.value = false
      }, 2000)
    }
  }
}
</script>

<template>
  <div class="container mx-auto">
    <VccHeader />

    <div class="mt-5 rounded-md border p-3">
      <div class="">
        <h1 class="text-lg font-bold">bc-meeting パスワードのリセット</h1>
        <p class="text-base">
          パスワードのリセット手続きに入ります。<br />
          メールアドレスを入力して、［メールアドレス送信］ボタンを押してください。
        </p>
      </div>
    </div>

    <div v-if="showErrorAlert">
      <div class="mt-5 rounded-md border p-3" style="line-height: 1rem" role="alert">
        <p class="">入力データに不備があります。</p>
      </div>
    </div>

    <div class="mt-5 rounded-md border p-3">
      <form class="" novalidate @submit.prevent="submitForm">
        <div class="">
          <div class="">
            <label for="email" class="">Email</label>
            <InputEmail
              id="email"
              class="w-64"
              placeholder="name@example.com"
              v-model="userStore.unverifiedEmail"
            />
          </div>
        </div>

        <div class="">
          <ButtonGeneralPrimary type="submit" class="m-2 rounded-md border px-2 py-1">
            メールアドレス送信
          </ButtonGeneralPrimary>
          <ButtonGeneralSecondary
            type="button"
            class="m-2 rounded-md border px-2 py-1"
            @click="toIndex"
          >
            Topへ戻る
          </ButtonGeneralSecondary>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
