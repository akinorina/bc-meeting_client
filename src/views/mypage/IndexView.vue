<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <div class="">Webapp4 User Page</div>
      <div class="">各ユーザーのための操作ができます。</div>
    </div>

    <div class="bg-slate-100 p-3">
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-md border bg-slate-50 p-2" v-if="authStore.getUsername() === 'mypage'">
          <router-link :to="{ name: 'mypage_users' }" class="">
            <div class="">
              <div class="flex flex-col items-center">
                <div class="font-bold">Users</div>
                <div class="">ユーザー管理</div>
              </div>
            </div>
          </router-link>
        </div>

        <div class="rounded-md border bg-slate-50 p-2">
          <router-link :to="{ name: 'mypage_images' }" class="">
            <div class="">
              <div class="flex flex-col items-center">
                <h5 class="font-bold">Image</h5>
                <p class="">画像</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="rounded-md border bg-slate-50 p-2">
          <router-link :to="{ name: 'mypage_blogs' }" class="">
            <div class="">
              <div class="flex flex-col items-center">
                <h5 class="font-bold">Blog</h5>
                <p class="">ブログ</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="rounded-md border bg-slate-50 p-2">
          <router-link :to="{ name: 'mypage_change-password' }" class="">
            <div class="">
              <div class="flex flex-col items-center">
                <h5 class="font-bold">change Password</h5>
                <p class="">パスワード変更</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
