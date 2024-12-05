<script setup lang="ts">
import { watch } from 'vue'
import type { BackgroundSettingObject } from '@/lib'

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
  <div class="background-image">
    <div class="background-image__images">
      <div class="text-bold p-2 text-sm">通常</div>
      <div class="flex flex-wrap justify-start gap-1">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div
            class="vbg"
            :class="{ selected: model === sKey }"
            v-if="item.type === 'normal'"
            @click="model = sKey"
          >
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>

      <div class="text-bold p-2 text-sm">ぼかし</div>
      <div class="flex flex-wrap justify-start gap-1">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div
            class="vbg"
            :class="{ selected: model === sKey }"
            v-if="item.type === 'blur'"
            @click="model = sKey"
          >
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>

      <div class="text-bold p-2 text-sm">画像</div>
      <div class="flex flex-wrap justify-start gap-1">
        <template v-for="(item, sKey) in videoModeData" :key="sKey">
          <div
            class="vbg"
            :class="{ selected: model === sKey }"
            v-if="item.type === 'image'"
            @click="model = sKey"
          >
            <img :src="item.url" class="vbg__image" />
            <input type="radio" class="vbg__radio" :value="sKey" v-model="model" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background-image {
  height: calc(100% - 50px);
  overflow-y: auto;

  &__images {
    width: 100%;
    height: 100%;
    margin: 0 auto;

    .vbg {
      width: 132px;
      margin: 10px 1px;
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
      border: 3px #000000 solid;
    }
  }
}
</style>
