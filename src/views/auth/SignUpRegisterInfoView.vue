<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { AxiosError } from 'axios'
import { digestMessage } from '@/lib/Functions'
import InputText from '@/components/ui/InputText.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import InputPassword from '@/components/ui/InputPassword.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue';

// stores
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const passwordRaw = ref('')
watch(passwordRaw, async (newPasswordRaw) => {
  user.value.password = await digestMessage(newPasswordRaw)
})

const showErrorAlert = ref(false)

// lifecycle
onMounted(() => {
  // QueryString取得
  const queryData: any = route.query
  // 新樹ユーザーデータ作成
  userStore.newUser()
  user.value.email = queryData.email
  user.value.email_hash = queryData.hash
})

// functions
const toIndex = () => {
  router.push({ name: 'index', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.registerUser()
    router.push({ name: 'sign-up-completion' })
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
    <div class="mt-3 border p-2">
      <div class="flex justify-center">
        <div>
          <div class="text-xl font-bold">vc-contact ユーザー登録</div>
          <div class="text-md mt-2">次の各項目を入力して、登録ボタンを押してください。</div>
        </div>
      </div>

      <div class="mt-3 flex justify-center" v-if="showErrorAlert">
        <div class="" style="line-height: 1rem" role="alert">
          <p class="">入力データに不備があります。</p>
          <p>メールアドレスが既に登録済みの場合があります。</p>
        </div>
      </div>

      <div class="mt-3 flex justify-center">
        <form class="" novalidate @submit.prevent="submitForm">
          <div class="flex flex-col">
            <div class="flex p-3">
              <label for="username" class="block w-32"> ユーザー表示名 </label>
              <input-text class="w-64" id="username" v-model="user.username" />
            </div>

            <div class="flex p-3">
              <label for="familyname" class="block w-32">姓</label>
              <input-text class="w-64" id="familyname" v-model="user.familyname" />
            </div>

            <div class="flex p-3">
              <label for="firstname" class="block w-32">名</label>
              <input-text class="w-64" id="firstname" v-model="user.firstname" />
            </div>

            <div class="flex p-3">
              <label for="familynameKana" class="block w-32">姓 ふりかな</label>
              <input-text class="w-64" id="familynameKana" v-model="user.familynameKana" />
            </div>

            <div class="flex p-3">
              <label for="firstnameKana" class="block w-32">名 ふりがな</label>
              <input-text class="w-64" id="firstnameKana" v-model="user.firstnameKana" />
            </div>

            <div class="flex p-3">
              <label for="email" class="block w-32">Email</label>
              <InputEmail
                id="email"
                class="w-64"
                placeholder="name@example.com"
                v-model="user.email"
                readonly
              />
            </div>

            <div class="flex p-3">
              <label for="password" class="block w-32">Password</label>
              <input-password
                id="password"
                class="w-64"
                placeholder="Password"
                v-model="passwordRaw"
              />
            </div>
          </div>

          <div class="flex justify-center p-3">
            <ButtonGeneralPrimary type="submit" class="me-2">登録</ButtonGeneralPrimary>
            <ButtonGeneralSecondary class="" @click="toIndex">Topへ戻る</ButtonGeneralSecondary>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
