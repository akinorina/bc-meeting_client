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

    <div class="">

      <div class="mt-3 border p-3">
        <h2 class="font-bold">General</h2>

        <!--
        <router-link :to="{ name: 'samples_buttons' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">Buttons</h5>
              <p class="">ボタン</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_generalmodal' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">General modal</h5>
              <p class="">General モーダルダイアログのサンプルです。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_ckeditor_classic' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">CKEditor - classic</h5>
              <p class="">WYSWIGエディター CLASSIC</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_ckeditor_inline' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">CKEditor - inline</h5>
              <p class="">WYSWIGエディター INLINE</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_ckeditor_balloon' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">CKEditor - balloon</h5>
              <p class="">WYSWIGエディター Balloon</p>
            </div>
          </div>
        </router-link>
        <router-link :to="{ name: 'samples_draggable' }" class="">
          <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
            <h5 class="">Vue Draggable</h5>
            <p class="">ドラッグ＆ドロップによる並べ替えができる。</p>
          </div>
        </router-link>
        -->
      </div>

      <div class="mt-3 border p-3">
        <h2 class="font-bold">Media - Video</h2>

        <!-- -->
        <router-link :to="{ name: 'samples_media' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">media</h5>
              <p class="">Media (video, audio) のサンプルです。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_media-normal' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">media (normal)</h5>
              <p class="">Mediaのサンプル (normal) です。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_media-alttext' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">media (alt text)</h5>
              <p class="">Mediaのサンプル (テキスト代替) です。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_media-blur' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">media (ぼかし)</h5>
              <p class="">Mediaのサンプル (バーチャル背景：ぼかし) です。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_media-vbg' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">media (画像)</h5>
              <p class="">Mediaのサンプル (バーチャル背景：画像) です。</p>
            </div>
          </div>
        </router-link>
        <!-- -->
      </div>

      <div class="mt-3 border p-3">
        <h2 class="font-bold">Media - Audio</h2>

        <!--
        <router-link :to="{ name: 'samples_audio' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">Volume Meter</h5>
              <p class="">Mic 入力の Volume Meter サンプルです。</p>
            </div>
          </div>
        </router-link>
        -->
      </div>

      <div class="mt-3 border p-3">
        <h2 class="font-bold">Payment</h2>

        <router-link :to="{ name: 'samples_payment' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">Payment サブスク新樹 サンプル</h5>
              <p class="">Stripe を使ったサブスクの新樹支払いのサンプル。</p>
            </div>
          </div>
        </router-link>

        <router-link :to="{ name: 'samples_payment' }" class="">
          <div class="">
            <div class="m-3 rounded-lg border p-3 hover:bg-sky-200">
              <h5 class="">Payment サブスク更新 サンプル</h5>
              <p class="">Stripe を使ったサブスクの継続支払いのサンプル。</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
