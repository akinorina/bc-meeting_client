<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { digestMessage } from '@/lib/Functions'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import InputText from '@/components/ui/InputText.vue'
import InputEmail from '@/components/ui/InputEmail.vue'
import InputPassword from '@/components/ui/InputPassword.vue'

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
onMounted(async () => {
  await userStore.newUser()
})

// functions
const toList = () => {
  router.push({ name: 'mypage_users', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.createUser()
    router.push({ name: 'mypage_users', params: {} })
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
    <div class="mx-3 my-2">
      <h2 class="my-2 font-bold">ユーザー - 新規作成</h2>
    </div>

    <div v-if="showErrorAlert">
      <div class="" role="alert">入力データに不備があります。</div>
    </div>

    <div class="m-3 border p-3">
      <form class="" novalidate @submit.prevent="submitForm">
        <div class="">
          <div class="flex p-3">
            <label for="username" class="block w-3/12">ユーザー名</label>
            <input-text class="w-9/12" id="username" v-model="user.username" />
          </div>

          <div class="flex p-3">
            <label for="familyname" class="block w-3/12">姓</label>
            <input-text class="w-9/12" id="familyname" v-model="user.familyname" />
          </div>

          <div class="flex p-3">
            <label for="firstname" class="block w-3/12">名</label>
            <input-text class="w-9/12" id="firstname" v-model="user.firstname" />
          </div>

          <div class="flex p-3">
            <label for="familynameKana" class="block w-3/12">姓 ふりかな</label>
            <input-text class="w-9/12" id="familynameKana" v-model="user.familynameKana" />
          </div>

          <div class="flex p-3">
            <label for="firstnameKana" class="block w-3/12">名 ふりがな</label>
            <input-text class="w-9/12" id="firstnameKana" v-model="user.firstnameKana" />
          </div>

          <div class="flex p-3">
            <label for="email" class="block w-3/12">Email</label>
            <InputEmail class="w-9/12" id="email" v-model="user.email" />
          </div>

          <div class="flex p-3">
            <label for="password" class="block w-3/12">Password</label>
            <input-password class="w-9/12" id="password" v-model="passwordRaw" />
          </div>
        </div>

        <div class="flex justify-center p-3">
          <ButtonGeneralPrimary type="button" class="me-2" @click="toList">戻る</ButtonGeneralPrimary>
          <ButtonGeneralPrimary type="submit" class="">作成</ButtonGeneralPrimary>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
