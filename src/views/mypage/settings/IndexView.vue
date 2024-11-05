<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue';
import InputPassword from '@/components/ui/InputPassword.vue'
import { digestMessage } from '@/lib/Functions'
import VccHeader from '@/components/VccHeader.vue';

// stores
const router = useRouter()
const userStore = useUserStore()

// variables
const resultSuccess = ref(false)
const resultFailure = ref(false)

const passwordOldRaw = ref('')
watch(passwordOldRaw, async (passwordOldRaw) => {
  userStore.oldPassword = await digestMessage(passwordOldRaw)
})

const passwordNewRaw = ref('')
watch(passwordNewRaw, async (passwordNewRaw) => {
  userStore.newPassword = await digestMessage(passwordNewRaw)
})

//
onMounted(() => {
  userStore.oldPassword = ''
  userStore.newPassword = ''
})

// functions - パスワード変更
const toMypage = () => {
  router.push({ name: 'mypage'})
}
const submitForm = async () => {
  try {
    await userStore.changePassword()

    resultSuccess.value = true
    setTimeout(() => {
      resultSuccess.value = false
    }, 2000)
  } catch (err) {
    resultFailure.value = true
    setTimeout(() => {
      resultFailure.value = false
    }, 2000)
  }
}
</script>

<template>
  <div class="container mx-auto h-screen bg-slate-100">
    <VccHeader />

    <div class="border p-3">
      <div class="font-bold">設定</div>
    </div>

    <div class="border p-3">
      <div class="">
        <h3 class="font-bold pb-3">パスワード変更</h3>
      </div>

      <div class="mb-3 bg-green-300 p-3" v-if="resultSuccess">パスワードが変更されました。</div>
      <div class="mb-3 bg-red-300 p-3" v-if="resultFailure">パスワード変更が失敗しました。</div>

      <form class="" novalidate @submit.stop.prevent="submitForm">
        <div class="flex flex-col items-center">
          <div class="">
            <label for="old_password" class="block w-48">パスワード</label>
            <InputPassword class="w-80" id="old_password" v-model="passwordOldRaw" />
          </div>

          <div class="mt-3">
            <label for="new_password" class="block w-48">新しいパスワード</label>
            <InputPassword class="w-80" id="new_password" v-model="passwordNewRaw" />
          </div>
        </div>

        <div class="mt-5 text-center">
          <ButtonGeneralPrimary type="submit" class="">更新</ButtonGeneralPrimary>
        </div>
      </form>
    </div>
    <div class="w-100 text-center p-3">
      <ButtonGeneralSecondary type="button" class="me-2" @click="toMypage">戻る</ButtonGeneralSecondary>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
