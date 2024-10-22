<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

// stores
const router = useRouter()
const userStore = useUserStore()

// lifecycle
onMounted(async () => {
  await userStore.getUsers()
})

// functions
const toNew = () => {
  router.push({ name: 'mypage_users_new', params: {} })
}
const toEdit = (iid: number) => {
  router.push({ name: 'mypage_users_edit', params: { id: iid } })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="mx-3 my-2">
      <h2 class="my-2 font-bold">ユーザー</h2>
    </div>

    <div class="mx-3 my-2">
      <ButtonGeneral type="button" class="" @click="toNew">
        <i class="">新規追加</i>
      </ButtonGeneral>
    </div>

    <div class="p-2">
      <div class="grid grid-cols-1 gap-2">
        <div
          class="rounded-sm border bg-slate-50 p-3"
          v-for="(item, index) in userStore.users"
          :key="index"
        >
          <div class="" @click="toEdit(item.id)">
            <div class="font-bold">{{ item.familyname }} {{ item.firstname }}</div>
            <div class="text-sm">{{ item.email }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
