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

          <router-link :to="{ name: 'samples_media-normal' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">media (normal)</h5>
                <p class="">Mediaのサンプル (normal) です。</p>
              </div>
            </div>
          </router-link>

          <router-link :to="{ name: 'samples_media-alttext' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">media (alt text)</h5>
                <p class="">Mediaのサンプル (テキスト代替) です。</p>
              </div>
            </div>
          </router-link>

          <router-link :to="{ name: 'samples_media-blur' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">media (ぼかし)</h5>
                <p class="">Mediaのサンプル (バーチャル背景：ぼかし) です。</p>
              </div>
            </div>
          </router-link>

          <router-link :to="{ name: 'samples_media-vbg' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">media (画像)</h5>
                <p class="">Mediaのサンプル (バーチャル背景：画像) です。</p>
              </div>
            </div>
          </router-link>
        </div>

        <div class="">
          <router-link :to="{ name: 'samples_audio' }" class="">
            <div class="">
              <div class="m-3 rounded-lg border p-3 hover:bg-slate-200">
                <h5 class="">Volume Meter</h5>
                <p class="">Mic 入力の Volume Meter サンプルです。</p>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
