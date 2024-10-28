<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue';

const router = useRouter()
const authStore = useAuthStore()

const signIn = () => {
  router.push({ name: 'sign-in' })
}
const signOut = async () => {
  await authStore.signOut()
  router.push({ name: 'sign-out' })
}
const signUp = () => {
  router.push({ name: 'sign-up' })
}
</script>

<template>
  <header class="container mx-auto flex bg-primary-600 text-white">
    <div class="flex-auto" v-if="authStore.isAuthenticated()">
      <div class="m-1 px-2 py-1">
        <router-link :to="{ name: 'mypage' }">
          <h1 class="text-3xl">bc-meeting</h1>
        </router-link>
      </div>
    </div>
    <div class="flex-auto" v-else>
      <div class="m-1 px-2 py-1">
        <router-link :to="{ name: 'index' }">
          <h1 class="text-3xl">bc-meeting</h1>
        </router-link>
      </div>
    </div>

    <div class="flex items-center" v-if="authStore.isAuthenticated()">
      <div class="me-2">{{ authStore.getUsername() }}</div>
      <ButtonGeneral class="m-2 rounded-2xl bg-slate-50 hover:bg-slate-300 text-slate-900 text-sm" @click="signOut">
        サインアウト
      </ButtonGeneral>
    </div>
    <div class="flex items-center" v-else>
      <ButtonGeneral class="m-2 rounded-2xl bg-slate-50 hover:bg-slate-300 text-slate-900 text-sm" @click="signIn">
        サインイン
      </ButtonGeneral>
      <ButtonGeneral class="m-2 rounded-2xl bg-slate-50 hover:bg-slate-300 text-slate-900 text-sm" @click="signUp">
        サインアップ
      </ButtonGeneral>
    </div>
  </header>
</template>

<style scoped lang="scss"></style>
