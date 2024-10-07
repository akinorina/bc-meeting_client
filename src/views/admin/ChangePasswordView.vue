<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import InputPassword from '@/components/ui/InputPassword.vue'
import { digestMessage } from '@/lib/Functions'

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

// functions
const toAdmin = () => {
  router.push({ name: 'admin', params: {} })
}
const submitForm = async () => {
  try {
    await userStore.changePassword()

    resultSuccess.value = true
    setTimeout(() => {
      resultSuccess.value = false
    }, 3000)
  } catch (err) {
    resultFailure.value = true
    setTimeout(() => {
      resultFailure.value = false
    }, 3000)
  }
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <div class="mb-3 bg-green-300 p-3" v-if="resultSuccess">パスワードが変更されました。</div>
      <div class="mb-3 bg-red-300 p-3" v-if="resultFailure">パスワード変更が失敗しました。</div>

      <form class="" novalidate @submit.stop.prevent="submitForm">
        <div class="flex flex-col items-center">
          <div class="flex justify-start">
            <label for="old_password" class="block w-48">これまでのパスワード</label>
            <input-password class="w-80" id="old_password" v-model="passwordOldRaw" />
          </div>

          <div class="mt-3 flex justify-start">
            <label for="new_password" class="block w-48">新しいパスワード</label>
            <input-password class="w-80" id="new_password" v-model="passwordNewRaw" />
          </div>
        </div>

        <div class="mt-5 text-center">
          <button-general type="button" class="me-2" @click="toAdmin">戻る</button-general>
          <button-general type="submit" class="">更新</button-general>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
