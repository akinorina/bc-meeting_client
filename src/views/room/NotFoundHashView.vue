<script setup lang="ts">
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <VccHeader />

    <div class="container mx-auto h-full rounded-xl border bg-slate-100 p-3">
      <div class="m-2">room ハッシュに誤りがあります。</div>
      <div class="m-2">
        <ButtonGeneralPrimary class="" @click="router.push({ name: 'index' })">
          &lt;&lt; Topページへ戻る
        </ButtonGeneralPrimary>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
