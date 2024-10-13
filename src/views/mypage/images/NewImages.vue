<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageStore } from '@/stores/image'
import { useRouter } from 'vue-router'
import InputText from '@/components/ui/InputText.vue'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

// stores
const router = useRouter()
const imageStore = useImageStore()
const { image } = storeToRefs(imageStore)

// lifecycle
onMounted(() => {
  imageStore.newImage()
})

// functions
const toList = () => {
  router.push({ name: 'mypage_images', params: {} })
}

const chooseImage = (ev: any) => {
  const fi = ev.target.files[0]
  image.value.originalname = fi.name
  image.value.mimetype = fi.type

  const reader = new FileReader()
  reader.onload = (evt) => {
    if (typeof evt.target?.result === 'string') {
      image.value.data = evt.target?.result
    }
  }
  reader.readAsDataURL(fi)
}

const submitForm = async () => {
  await imageStore.createImage()
  router.push({ name: 'mypage_images', params: {} })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <form class="" novalidate @submit.prevent="submitForm">
        <div class="">
          <div class="flex p-3">
            <label for="familyname" class="block w-40">画像表示名</label>
            <input-text class="w-60" id="familyname" v-model="image.name" />
          </div>

          <div class="flex p-3">
            <label for="familyname" class="block w-40">画像ファイル</label>
            <input
              type="file"
              class="w-60"
              id="familyname"
              name="image_file"
              @change="chooseImage"
            />
          </div>
        </div>

        <div class="">
          <button-general type="button" class="me-2" @click="toList">戻る</button-general>
          <button-general type="submit" class="">作成</button-general>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
