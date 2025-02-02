<script setup lang="ts">
</script>

<template>
  <div class="container mx-auto border p-3">
    <h1 class="">payment view</h1>

    <div class="border p-3 my-3">
      <h1>支払いフォーム</h1>
      <div class="">
        <!-- <a href="https://buy.stripe.com/test_8wM9CL8sV1Bl4A88wy">支払いフォーム</a> -->

        <stripe-buy-button
          customer-email="akinori.na@gmail.com"
          buy-button-id="buy_btn_1QnxuYKG5jHHm9FLiOMMe8mG"
          publishable-key="pk_test_51QnfcQKG5jHHm9FLvuRtSw8InPhZjxjWxAjhTRvFi0Gsqnr1nHJHKdm2uP2ChPn0vsZwXRsUmpxm9pjNDtlagAWS00xyXEQu5E"
        >
        </stripe-buy-button>
      </div>
    </div>

    <div class="border p-3 my-3">
      <h1>カスタマーポータル</h1>
      <div class="">
        <a href="https://billing.stripe.com/p/login/test_eVa16Z8r05owefS4gh">stripe カスタマーポータル page へ</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>
