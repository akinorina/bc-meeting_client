<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { digestMessage } from '@/lib/Functions'
import InputEmail from '@/components/ui/InputEmail.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue';

// stores
const router = useRouter()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const passwordRaw = ref('')
watch(passwordRaw, async (newPasswordRaw) => {
  user.value.password = await digestMessage(newPasswordRaw)
})

const showErrorAlert = ref(false)

// lifecycle
onMounted(() => {
  userStore.newUser()
})

// functions
const toIndex = () => {
  router.push({ name: 'index', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.verifyingEmail('/signup-register-info')
    router.push({ name: 'sign-up-sent-email' })
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
    <div class="mt-3 border p-3">
      <div class="px-2">
        <div class="text-xl">bc-meeting ユーザー登録</div>
        <p class="text-xs">
          ユーザー登録ページです。<br />
          次の各項目を入力して登録ボタンを押してください。
        </p>
      </div>

      <div v-if="showErrorAlert">
        <div class="my-3 border p-3" role="alert">
          <p class="">入力データに不備があります。</p>
          <p>メールアドレスが既に登録済みの場合があります。</p>
        </div>
      </div>

      <div class="my-3 p-3">
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
            <ButtonGeneralSecondary type="button" class="m-2 rounded-md border px-2 py-1" @click="toIndex">
              Topへ戻る
            </ButtonGeneralSecondary>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
