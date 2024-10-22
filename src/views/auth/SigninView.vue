<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { digestMessage } from '@/lib/Functions'

import InputText from '@/components/ui/InputText.vue'
import InputPassword from '@/components/ui/InputPassword.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'

const authStore = useAuthStore()
const router = useRouter()
const showErrorMessage = ref(false)

const passwordRaw = ref('')
watch(passwordRaw, async (newPasswordRaw) => {
  authStore.password = await digestMessage(newPasswordRaw)
})

onMounted(() => {
  passwordRaw.value = ''
  authStore.password = ''
})

const submitSignin = async () => {
  try {
    await authStore.signIn()
    router.push({ name: 'mypage' })
  } catch (err: any) {
    if (err.response.status === 401) {
      showErrorMessage.value = true
      setTimeout(() => {
        showErrorMessage.value = false
      }, 2000)
    } else {
      throw err
    }
  }
}

const signInGoogle = () => {
  authStore.signInByGoogle()
}
</script>

<template>
  <div class="container mx-auto">
    <form @submit.prevent="submitSignin">
      <div class="my-3 border p-3">
        <div class="m-3 flex justify-center">Please sign in</div>

        <div class="flex justify-center" v-if="showErrorMessage">
          <div class="" role="alert">Email または Password が間違っています。</div>
        </div>

        <div class="m-3 flex justify-center">
          <div class="border p-3">
            <div class="flex p-3">
              <div class="w-24">
                <label for="floatingInput">Email</label>
              </div>
              <div class="">
                <input-text
                  id="floatingInput"
                  v-model="authStore.email"
                  placeholder="name@example.com"
                  class="w-64"
                />
              </div>
            </div>
            <div class="flex p-3">
              <div class="w-24">
                <label for="floatingPassword">Password</label>
              </div>
              <div class="">
                <input-password
                  id="floatingPassword"
                  v-model="passwordRaw"
                  placeholder="Password"
                  class="w-64"
                />
              </div>
            </div>
            <div class="flex justify-center">
              <ButtonGeneralPrimary type="submit" class="rounded-md border px-3 py-1">
                サインイン
              </ButtonGeneralPrimary>
            </div>
          </div>
        </div>
      </div>
    </form>

    <div class="my-3 border">
      <div class="p-3 text-center">
        <router-link :to="{ name: 'reset-password' }"> パスワードを忘れた場合 </router-link>
      </div>
    </div>

    <div class="my-3 border">
      <div class="p-3 text-center">
        <button class="" @click="signInGoogle">googleアカウントでログイン</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
