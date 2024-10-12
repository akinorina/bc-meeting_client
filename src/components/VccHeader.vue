<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const signIn = () => {
  router.push({ name: 'sign-in' })
}
const signOut = () => {
  authStore.signOut()
  router.push({ name: 'sign-out' })
}
const signUp = () => {
  router.push({ name: 'sign-up' })
}
</script>

<template>
  <header class="container mx-auto flex bg-yellow-400">
    <div class="flex-auto" v-if="authStore.isAuthenticated()">
      <div class="m-1 px-2 py-1">
        <router-link :to="{ name: 'mypage' }">
          <h1 class="text-xl">vc-contact - my page</h1>
        </router-link>
      </div>
    </div>
    <div class="flex-auto" v-else>
      <div class="m-1 px-2 py-1">
        <router-link :to="{ name: 'index' }">
          <h1 class="text-xl">vc-contact</h1>
        </router-link>
      </div>
    </div>

    <div class="flex items-center" v-if="authStore.isAuthenticated()">
      <div class="me-2">{{ authStore.getUsername() }}</div>
      <button type="button" class="m-1 rounded-md border bg-white px-2 py-1" @click="signOut">
        Sign-out
      </button>
    </div>
    <div class="flex items-center" v-else>
      <button type="button" class="m-1 rounded-md border bg-white px-2 py-1" @click="signIn">
        Sign-in
      </button>
      <button type="button" class="m-1 rounded-md border bg-white px-2 py-1" @click="signUp">
        Sign-up
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss"></style>
