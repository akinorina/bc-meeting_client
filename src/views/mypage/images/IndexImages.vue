<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '@/stores/image'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

// stores
const router = useRouter()
const imageStore = useImageStore()

// env
const pathPrefix = import.meta.env.VITE_STORAGE_PATH_PREFIX

// lifecycle
onMounted(async () => {
  await imageStore.getImages()
})

// functions
const toNew = () => {
  router.push({ name: 'mypage_images_new', params: {} })
}
const toEdit = (iid: number) => {
  router.push({ name: 'mypage_images_edit', params: { id: iid } })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="mx-3 my-2">
      <h2 class="my-2 font-bold">画像</h2>
    </div>

    <div class="my-2">
      <ButtonGeneral class="" @click="toNew">新規作成</ButtonGeneral>
    </div>

    <div class="">
      <div class="mx-auto">
        <div class="flex flex-row flex-wrap justify-start gap-0">
          <div class="flex-auto" v-for="(item, index) in imageStore.images" :key="index">
            <div
              class="flex size-48 items-center justify-center overflow-hidden border border-white"
            >
              <img
                class="overflow-hidden"
                :src="pathPrefix + item.path"
                :alt="item.name"
                @click="toEdit(item.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
