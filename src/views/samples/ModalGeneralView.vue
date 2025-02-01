<script setup lang="ts">
import { ref } from 'vue'
import ModalGeneral from '@/components/ui/ModalGeneral.vue'
import ButtonGeneral from '@/components/ui/ButtonGeneral.vue'

const gmodal = ref()
const gmodal2 = ref()
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <h2 class="font-bold">Webapp4 - Samples</h2>
      <div class="">sample of general modal</div>
    </div>

    <!-- モーダル 1 -->
    <div class="m-3 border p-3">
      <ButtonGeneral type="button" class="" @click="gmodal.open()">open modal 1</ButtonGeneral>

      <modal-general ref="gmodal" :is-close-modal-back="true">
        <div class="">
          <div class="h-54 w-96 p-3">
            ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。
            ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。
          </div>
          <div class="mb-3 text-center">
            <ButtonGeneral class="" @click="gmodal.close()">close</ButtonGeneral>
          </div>
        </div>
      </modal-general>
    </div>

    <!-- モーダル 2 -->
    <div class="m-3 border p-3">
      <ButtonGeneral type="button" class="" @click="gmodal2.open()">open modal 2</ButtonGeneral>

      <modal-general
        ref="gmodal2"
        :is-close-modal-back="false"
        :class-bg="''"
        :class-fg="'bg-green-300'"
        :style-bg="'background-color: rgba(255, 255, 200, 0.75)'"
        :style-fg="''"
      >
        <div class="">
          <div class="h-54 w-96 p-3">
            ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。
            ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。ここに本文を書きます。
          </div>
          <div class="mb-3 text-center">
            <ButtonGeneral class="" @click="gmodal2.close()">close</ButtonGeneral>
          </div>
        </div>
      </modal-general>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
