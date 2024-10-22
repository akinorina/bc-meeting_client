<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { defineAsyncComponent, ref } from 'vue'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import InputText from '@/components/ui/InputText.vue'
import InputEmail from '@/components/ui/InputEmail.vue'

//@ts-ignore
const ModalGeneral = defineAsyncComponent(() => import('@/components/ModalGeneral.vue'))

// stores
const router = useRouter()
const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const props = defineProps({
  id: { type: String, required: true }
})
const id = parseInt(props.id) ?? 0

// modal
const modalUpdateConfirm = ref()
const modalUpdateSuccess = ref()
const modalDeleteConfirm = ref()
const modalDeleteSuccess = ref()

// lifecycle
onMounted(async () => {
  await userStore.getUser(id)
})

// functions
const toIndex = () => {
  router.push({ name: 'mypage_users', params: { id: id } })
}
const updateUser = async () => {
  modalUpdateConfirm.value.close()
  // ユーザー情報更新
  await userStore.updateUser(id)
  // ユーザー情報 再取得
  await userStore.getUser(id)
  modalUpdateSuccess.value.open()
  setTimeout(() => {
    modalUpdateSuccess.value.close()
  }, 3000)
}
const deleteUser = async () => {
  modalDeleteConfirm.value.close()
  // ユーザー情報 削除
  await userStore.deleteUser(id)
  modalDeleteSuccess.value.open()
  setTimeout(() => {
    modalDeleteSuccess.value.close()
    router.push({ name: 'mypage_users' })
  }, 3000)
}
</script>

<template>
  <div class="container mx-auto">
    <div class="mx-3 my-2">
      <h2 class="my-2 font-bold">ユーザー - 編集</h2>
    </div>

    <div class="m-3 border p-3">
      <form class="" novalidate @submit.prevent="modalUpdateConfirm.open()">
        <div class="">
          <div class="flex p-3">
            <label for="username" class="block w-3/12">ID</label>
            <div class="w-9/12">{{ user.id }}</div>
          </div>

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
        </div>

        <div class="flex justify-center p-3">
          <ButtonGeneral type="button" class="me-2" @click="toIndex">戻る</ButtonGeneral>
          <ButtonGeneral type="submit" class="me-2">更新</ButtonGeneral>
          <ButtonGeneral type="button" class="" @click="modalDeleteConfirm.open()">
            削除
          </ButtonGeneral>
        </div>
      </form>
    </div>
  </div>

  <ModalGeneral ref="modalUpdateConfirm">
    <div class="h-54 w-80 rounded-lg border p-3">
      <div class="mb-3 text-center">
        <div class="font-bold">ユーザー情報</div>
        <div class="">更新してよろしいですか？</div>
      </div>
      <div class="mb-3 text-center">
        <ButtonGeneral class="me-2 w-24" @click="updateUser">はい</ButtonGeneral>
        <ButtonGeneral class="w-24" @click="modalUpdateConfirm.close()">いいえ</ButtonGeneral>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalUpdateSuccess">
    <div class="h-54 w-80 rounded-lg border p-3">
      <div class="mb-3 text-center">
        <div class="font-bold">ユーザー情報</div>
        <div class="">更新しました。</div>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalDeleteConfirm">
    <div class="h-54 w-80 rounded-lg border p-3">
      <div class="mb-3 text-center">
        <div class="font-bold">ユーザー情報</div>
        <div class="">削除してよろしいですか？</div>
      </div>
      <div class="mb-3 text-center">
        <ButtonGeneral class="me-2 w-24" @click="deleteUser">はい</ButtonGeneral>
        <ButtonGeneral class="w-24" @click="modalDeleteConfirm.close()">いいえ</ButtonGeneral>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalDeleteSuccess">
    <div class="h-54 w-80 rounded-lg border p-3">
      <div class="mb-3 text-center">
        <div class="font-bold">ユーザー情報</div>
        <div class="">削除しました。</div>
      </div>
    </div>
  </ModalGeneral>
</template>

<style scoped lang="scss"></style>
