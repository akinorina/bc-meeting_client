<script setup lang="ts"></script>

<template>
  <div class="container mx-auto">
    <div class="border p-3">
      <h2 class="font-bold">Webapp4 - Samples</h2>
      <p class="text-xs">
        Web アプリケーション テンプレート ver.4 のサンプルページです。<br />
        種々の機能をサンプルとして実現しています。
      </p>
    </div>

    <div class="mt-3 border p-3">
      <div class="">
        <div class="">
          <router-link :to="{ name: 'samples_generalmodal' }" class="">
            <div class="">
              <div class="">
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
