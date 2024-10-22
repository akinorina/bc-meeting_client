<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'

const router = useRouter()

const toTop = async () => {
  router.push({ name: 'index' })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="p-3">
      <h1 class="p-2 text-center">サインアウトしました。</h1>
    </div>

    <div class="p-3 text-center">
      <ButtonGeneralPrimary class="" @click="toTop">Topページへ</ButtonGeneralPrimary>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
