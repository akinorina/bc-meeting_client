<script setup lang="ts">
import { ref } from 'vue'
import draggable from 'vuedraggable'

const dataList = ref<any[]>([
  { id: 2, name: 'Aki4', age: 40 },
  { id: 1, name: 'Aki3', age: 30 },
  { id: 3, name: 'Aki5', age: 50 },
  { id: 4, name: 'Aki6', age: 60 }
])

const drag = ref(false)

const sort001 = () => {
  dataList.value.sort((a: any, b: any) => {
    return a.age > b.age ? -1 : a.age === b.age ? 0 : 1
  })
}
</script>

<template>
  <div class="container mx-auto">
    <div class="">
      <draggable
        v-model="dataList"
        group="people"
        @start="drag = true"
        @end="drag = false"
        item-key="id"
        handle=".handle"
      >
        <template #item="{ element }">
          <div class="handle m-2 p-2 border-4 border-slate-200 bg-white cursor-pointer">
            <div>{{ element.id }} - {{ element.name }}</div>
          </div>
        </template>
      </draggable>
    </div>

    <div class="w-96 border-0 border-red-500 p-2">
      <button type="button" class="border bg-red-300 p-2" @click="sort001">sort</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
