<script setup lang="ts">
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue'
import ButtonGeneralSecondary from '@/components/ui/ButtonGeneralSecondary.vue'
import ButtonGeneralDanger from '@/components/ui/ButtonGeneralDanger.vue'
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <h2 class="font-bold">bc-meeting - Samples</h2>
      <p class="text-xs">
        Web アプリケーション テンプレート ver.4 のサンプルページです。<br />
        種々の機能をサンプルとして実現しています。
      </p>
    </div>

    <div class="mt-3 border p-3">
      <div class="m-3">
        <ButtonGeneral class="me-3">ButtonGeneral<template #explain>ここに説明が入ります。</template></ButtonGeneral>
      </div>
      <div class="m-3">
        <ButtonGeneralPrimary class="me-3">ButtonGeneralPrimary<template #explain>ここに説明が入ります。</template></ButtonGeneralPrimary>
      </div>
      <div class="m-3">
        <ButtonGeneralSecondary class="me-3">ButtonGeneralSecondary<template #explain>ここに説明が入ります。</template></ButtonGeneralSecondary>
      </div>
      <div class="m-3">
        <ButtonGeneralDanger class="me-3">ButtonGeneralDanger<template #explain>ここに説明が入ります。</template></ButtonGeneralDanger>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
