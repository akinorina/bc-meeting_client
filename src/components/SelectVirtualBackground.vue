<script setup lang="ts">
import { watch } from 'vue'
import type { BackgroundSettingObject } from '@/lib';

const model = defineModel()
watch(model, () => {
  emit('change')
})

export interface Props {
  videoModeData: BackgroundSettingObject
}
const { videoModeData = {} } = defineProps<Props>()

const emit = defineEmits(['change'])
</script>

<template>
  <div class="h-full" style="background-color: #a0a0a0;">
    <div class="select-background-image">
      <div class="text-sm text-bold p-2">通常</div>
      <div class="flex flex-wrap gap-1 justify-start">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div class="vbg" :class="{ 'selected': model === sKey }" v-if="item.type === 'normal'" @click="model = sKey">
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>

      <div class="text-sm text-bold p-2">ぼかし</div>
      <div class="flex flex-wrap gap-1 justify-start">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div class="vbg" :class="{ 'selected': model === sKey }" v-if="item.type === 'blur'" @click="model = sKey">
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>

      <div class="text-sm text-bold p-2">画像</div>
      <div class="flex flex-wrap gap-1 justify-start">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div class="vbg" :class="{ 'selected': model === sKey }" v-if="item.type === 'image'" @click="model = sKey">
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.select-background-image {
  width: 310px;
  margin: 0 auto;
  background-color: #a0a0a0;
  overflow-y: auto;

  .vbg {
    width: 152px;
    margin: 0 auto;
    position: relative;

    &_image {
      width: 100%;
      height: 100%;
    }

    &__radio {
      position: absolute;
      top: 12px;
      right: 12px;
      display: none;
      transform: scale(2);
      cursor: pointer;
    }
  }
  .vbg.selected {
    border: 3px black solid;
  }
}

</style>
