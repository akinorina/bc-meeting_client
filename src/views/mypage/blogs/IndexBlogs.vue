<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

// stores
const router = useRouter()
const blogStore = useBlogStore()

// lifecycle
onMounted(async () => {
  await blogStore.getBlogs()
})

// functions
const toNew = () => {
  router.push({ name: 'mypage_blogs_new', params: {} })
}
const toEdit = (iid: number) => {
  router.push({ name: 'mypage_blogs_edit', params: { id: iid } })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="mx-3 my-2">
      <h2 class="my-2 font-bold">Blog</h2>
    </div>

    <div class="m-2">
      <button-general type="button" class="" @click.stop="toNew">新規作成</button-general>
    </div>

    <div class="m-2 grid grid-cols-1 gap-2">
      <div class="bg-slate-100" v-for="(item, index) in blogStore.blogs" :key="index">
        <div class="border p-3" @click.stop="toEdit(item.id)">
          <div>{{ item.subject }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
