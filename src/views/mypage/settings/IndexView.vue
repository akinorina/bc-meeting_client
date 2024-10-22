<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import InputPassword from '@/components/ui/InputPassword.vue'
import { digestMessage } from '@/lib/Functions'
import GoBack from '@/components/GoBack.vue'

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
    }, 3000)
  } catch (err) {
    resultFailure.value = true
    setTimeout(() => {
      resultFailure.value = false
    }, 3000)
  }
}

// import { onMounted, ref } from 'vue'
// import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';
// import InputPassword from '@/components/ui/InputPassword.vue';
// import { RouterLink, useRouter } from 'vue-router'
// import { useAuthStore } from '@/stores/auth'
// import { useRoomStore } from '@/stores/rooms';
// import ModalGeneral from '@/components/ModalGeneral.vue';
// import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';

// const router = useRouter()

// const roomStore = useRoomStore()
// const authStore = useAuthStore()

// const modal1 = ref()
// const modal2 = ref()

// onMounted(() => {
// })

const goBack = () => {
  router.push({ name: 'mypage' });
}

</script>

<template>
  <div class="container mx-auto h-screen bg-slate-100">
    <div class="border p-3">
      <div class="font-bold">設定</div>
    </div>

    <GoBack
      @click="goBack"
    />

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
          <ButtonGeneral type="submit" class="">更新</ButtonGeneral>
        </div>
      </form>
    </div>
    <div class="w-100 text-center p-3">
      <ButtonGeneral type="button" class="me-2 bg-back-300 hover:bg-back-400 text-black" @click="toMypage">戻る</ButtonGeneral>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
