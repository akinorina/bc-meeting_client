<script setup lang="ts">
import VccHeader from '@/components/VccHeader.vue'
</script>

<template>
  <div class="container mx-auto">
    <VccHeader />

    <div class="border p-3">
      <h2 class="font-bold">bc-meeting - Samples</h2>
      <p class="text-xs">
        Web アプリケーション テンプレート ver.4 のサンプルページです。<br />
        種々の機能をサンプルとして実現しています。
      </p>
    </div>

    <div class="mt-3 border p-3">
      <div class="">
        <div class="">
          <router-link :to="{ name: 'samples_buttons' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">Buttons</h5>
                <p class="">ボタン</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="">
          <router-link :to="{ name: 'samples_generalmodal' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">General modal</h5>
                <p class="">General モーダルダイアログのサンプルです。</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="">
          <router-link :to="{ name: 'samples_media' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">media</h5>
                <p class="">Media (video, audio) のサンプルです。</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="">
          <router-link :to="{ name: 'samples_tf' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">Tensor Flow</h5>
                <p class="">ML のサンプルです。</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
