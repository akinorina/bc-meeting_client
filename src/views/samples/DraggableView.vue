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
  <div class="base">
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
          <div class="handle">
            <div>{{ element.id }} - {{ element.name }}</div>
          </div>
        </template>
      </draggable>
    </div>
    <div class="w-96 border border-red-500 p-2">
      <button type="button" class="border bg-red-300 p-2" @click="sort001">push me.</button>
    </div>
    <div class="w-80">
      {{ dataList }}
    </div>

    <!--
    <div class="item" v-for="(item, key) in dataList" :key="item.id">
      <div class="">{{ item.id }}</div>
      <div class="">{{ item.name }}</div>
      <div class="">{{ key }}</div>
    </div>
    -->
  </div>
</template>

<style lang="scss" scoped>
.base {
  width: 200px;
  margin: 10px;

  .item {
    border: 1px red dashed;
  }
}
</style>
