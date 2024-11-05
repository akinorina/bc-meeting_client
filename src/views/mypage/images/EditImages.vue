<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageStore } from '@/stores/image'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ModalGeneral from '@/components/ModalGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import InputText from '@/components/ui/InputText.vue'

// //@ts-ignore
// const BsModal = defineAsyncComponent(() => import('@/components/BsModal.vue'))

// stores
const router = useRouter()
const imageStore = useImageStore()
const { image } = storeToRefs(imageStore)

// env
const pathPrefix = import.meta.env.VITE_STORAGE_PATH_PREFIX

// modal
const modalUpdateConfirm = ref()
const modalUpdateSuccess = ref()
const modalDeleteConfirm = ref()
const modalDeleteSuccess = ref()

const props = defineProps({
  id: { type: String, required: true }
})
const id = parseInt(props.id) ?? 0

// lifecycle
onMounted(() => {
  imageStore.getImage(id)
})

// functions
const toList = () => {
  router.push({ name: 'mypage_images', params: {} })
}
const updateImage = async () => {
  modalUpdateConfirm.value.close()
  // 画像情報 更新
  await imageStore.updateImage(id)
  modalUpdateSuccess.value.open()
  setTimeout(() => {
    modalUpdateSuccess.value.close()
  }, 2000)
}
const deleteImage = async () => {
  modalDeleteConfirm.value.close()
  // 画像情報 削除
  await imageStore.deleteImage(id)
  modalDeleteSuccess.value.open()
  setTimeout(() => {
    modalDeleteSuccess.value.close()
    router.push({ name: 'mypage_images', params: {} })
  }, 2000)
}
</script>

<template>
  <div class="containter mx-auto">
    <form class="" novalidate @submit.stop.prevent="modalUpdateConfirm.open()">
      <div class="p-3">
        <div class="flex gap-4">
          <div class="">
            <div class="w-96">
              <img :src="pathPrefix + image.path" class="" />
            </div>
          </div>
          <div class="">
            <div class="">
              <div class="" style="width: 100%">
                <label for="imagename" class="block">表示名</label>
                <input-text class="" id="imagename" v-model="image.name" />
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3">
          <ButtonGeneralPrimary type="button" class="me-2" @click="toList"
            >戻る</ButtonGeneralPrimary
          >
          <ButtonGeneralPrimary type="submit" class="me-2"> 更新 </ButtonGeneralPrimary>
          <ButtonGeneralPrimary type="button" class="" @click="modalDeleteConfirm.open()">
            削除
          </ButtonGeneralPrimary>
        </div>
      </div>
    </form>
  </div>

  <ModalGeneral ref="modalUpdateConfirm">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">画像情報</div>
        <div class="m-3">更新してよろしいですか？</div>
      </div>
      <div class="text-center">
        <ButtonGeneralPrimary class="me-2" @click="updateImage">はい</ButtonGeneralPrimary>
        <ButtonGeneralPrimary class="" @click="modalUpdateConfirm.close()"
          >いいえ</ButtonGeneralPrimary
        >
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalUpdateSuccess">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">画像情報</div>
        <div class="m-3">更新しました。</div>
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalDeleteConfirm">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">画像情報</div>
        <div class="m-3">削除してよろしいですか？</div>
      </div>
      <div class="text-center">
        <ButtonGeneralPrimary class="me-2" @click="deleteImage">はい</ButtonGeneralPrimary>
        <ButtonGeneralPrimary class="" @click="modalDeleteConfirm.close()"
          >いいえ</ButtonGeneralPrimary
        >
      </div>
    </div>
  </ModalGeneral>

  <ModalGeneral ref="modalDeleteSuccess">
    <div class="w-64 p-3">
      <div class="text-center">
        <div class="font-bold">画像情報</div>
        <div class="m-3">削除しました。</div>
      </div>
    </div>
  </ModalGeneral>
</template>

<style scoped lang="scss">
.main {
  min-height: 100vh;
  color: var(--bs-body-color);
  background-color: var(--bs-body-bg);

  .users_title {
    position: relative;
  }
  .image {
    max-width: 100%;
    max-height: 650px;
  }

  .imagename {
    width: 100%;
  }
}
</style>
