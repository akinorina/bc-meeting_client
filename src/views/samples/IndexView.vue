<script setup lang="ts"></script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <h2 class="font-bold">vc-contact - Samples</h2>
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
              <div class="border p-3 m-3 rounded-lg hover:bg-slate-200">
                <h5 class="">Buttons</h5>
                <p class="">ボタン</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="">
          <router-link :to="{ name: 'samples_generalmodal' }" class="">
            <div class="">
              <div class="border p-3 m-3 rounded-lg hover:bg-slate-200">
                <h5 class="">General modal</h5>
                <p class="">General モーダルダイアログのサンプルです。</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
