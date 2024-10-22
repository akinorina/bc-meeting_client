<script setup lang="ts">
import { useRouter } from 'vue-router'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

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
      <ButtonGeneral class="" @click="toTop">Topページへ</ButtonGeneral>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
