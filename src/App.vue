<script setup lang="ts">
import { RouterView } from 'vue-router'
import VccHeader from './components/VccHeader.vue'
</script>

<template>
  <div class="h-screen">
    <VccHeader />
    <router-view />
  </div>
</template>

<style scoped></style>
