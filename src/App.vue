<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterView } from 'vue-router'
import VccHeader from './components/VccHeader.vue'

const pageName = ref('')
const noLayoutPageNames = ['room']

const router = useRouter()
router.beforeEach((to, from, next) => {
  if (to.name === 'room') {
    pageName.value = 'room'
  } else {
    pageName.value = ''
  }
  next()
})

</script>

<template>
  <template v-if="noLayoutPageNames.includes(pageName)">
    <div class="h-screen">
      <router-view />
    </div>
  </template>
  <template v-else>
    <div class="h-screen">
      <VccHeader />
      <router-view />
    </div>
  </template>
</template>

<style scoped></style>
