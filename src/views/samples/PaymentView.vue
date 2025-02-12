<script setup lang="ts">
import dayjs from 'dayjs'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue';
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElementOptions,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import { useStripeStore } from '../../stores/stripe';
import ButtonGeneralPrimary from '@/components/ui/ButtonGeneralPrimary.vue';
import VccHeader from '@/components/VccHeader.vue';

const authStore = useAuthStore()
const stripeStore = useStripeStore()

// Stripe関連プロパティ
const publishableKey = ref('')
const stripe = ref<Stripe>()
const prices = ref()
const priceSelected = ref()
const customer = ref()
const customerId = ref('')
const subscription = ref()
const clientSecret = ref('')
const elements = ref<StripeElements>()
const paymentElement = ref<StripePaymentElement>()
const invoices = ref<any[]>([])

// 選択値
const name = ref('Akinori Nakata')
const email = ref('')
const priceId = ref('')

// others
const stepName = ref('')
const messages = ref<string[]>([])
const isLoading = ref(false);

onMounted(async () => {
  // publishableKey
  const config = await stripeStore.getConfig()
  publishableKey.value = config.data.publishableKey
  console.log('publishableKey', publishableKey.value)

  // Stripe
  stripe.value = await loadStripe(publishableKey.value) as Stripe;

  // Prices一覧 取得
  prices.value = (await stripeStore.getPrices()).prices
  console.log('prices', prices.value)
  if (prices.value.length === 0) {
    throw new Error('価格データがありませんでした。')
  }
  priceId.value = prices.value[0].id

  // サインインユーザー情報取得
  const profile = await authStore.getProfile()
  // console.log('profile', profile)
  name.value = profile.data.username
  email.value = profile.data.email
  console.log('name', name.value)
  console.log('email', email.value)

  // customer を email で検索し、存在しない場合は新規作成する。
  const listCustomers = await stripeStore.listCustomer(email.value)
  if (listCustomers.customers.data.length > 0) {
    console.log('..... Customerが見つかりました。')
    customerId.value = listCustomers.customers.data[0].id
  } else {
    console.log('..... Customerが見つかりませんでした。新樹作成します。')
    // create customer
    customer.value = await stripeStore.createCustomer(name.value, email.value)
    customerId.value = customer.value.customer.id
  }
  console.log('customerId', customerId.value)

  // Subscription 既存から取得
  const listSubscriptions = (await stripeStore.listSubscription(customerId.value, priceId.value))
  // console.log('subscriptions', listSubscriptions.subscriptions.data)
  if (listSubscriptions.subscriptions.data.length === 0) {
    console.log('..... Subscription が見つかりませんでした。', listSubscriptions.subscriptions.data.length)
  } else {
    console.log('..... Subscription が見つかりました。', listSubscriptions.subscriptions.data.length)
    subscription.value = listSubscriptions.subscriptions.data[0]
    console.log('::: subscription', subscription.value)

    invoices.value = await stripeStore.listInvoices(subscription.value.id);
    console.log('invoices', invoices.value)

    stepName.value = 'available'
  }

  // isLoading.value = false;
})

const submitSubscribe1 = async (selectedPriceId: string) => {
  console.log('--- submitSubscribe1() ---', selectedPriceId)
  priceId.value = selectedPriceId

  stepName.value = 'create2'

  if (!stripe.value) {
    return false
  }
  if (isLoading.value) {
    return;
  }
  // isLoading.value = true;
  console.log('--- submitSubscribe1() --- 2')

  // 選択した価格、商品情報
  const selectedIndex = prices.value.findIndex((item: any) => {
    return item.id === priceId.value
  })
  priceSelected.value = prices.value[selectedIndex]
  console.log('priceSelected', priceSelected.value)

  // Subscription 既存から取得
  const listSubscriptions = (await stripeStore.listSubscription(customerId.value, priceId.value))
  // console.log('subscriptions', listSubscriptions.subscriptions.data)
  if (listSubscriptions.subscriptions.data.length > 0) {
    // ある
    console.log('..... Subscription が見つかりました。')
    subscription.value = listSubscriptions.subscriptions.data[0]
    console.log('::: subscription', subscription.value)

    clientSecret.value = subscription.value.latest_invoice.payment_intent.client_secret
  } else {
    // なし
    console.log('..... Subscription が見つかりませんでした。新樹作成します。')
    // create subscription
    // console.log('customerId:', customerId.value)
    // console.log('priceId   :', priceId.value)
    subscription.value = await stripeStore.createSubscription(
      customerId.value,
      priceId.value
    )
    console.log('subscription', subscription.value)
    clientSecret.value = subscription.value.clientSecret
  }
  console.log('clientSecret  :', clientSecret.value)

  // [2]: 決済フォーム作成
  elements.value = stripe.value.elements({ clientSecret: clientSecret.value }) as StripeElements;
  const paymentOptions: StripePaymentElementOptions = {
    defaultValues: { billingDetails: { email: email.value } },
    layout: { type: 'tabs', defaultCollapsed: false }
  }
  paymentElement.value = elements.value.create('payment', paymentOptions);
  paymentElement.value.mount('#payment-element');
  // Create and mount the linkAuthentication Element to enable autofilling customer payment details
  const linkAuthenticationElement = elements.value.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");

  // isLoading.value = false;
}

const submitSubscribe2 = async () => {
  if (!elements.value) {
    return false
  }
  if (!stripe.value) {
    return false
  }

  // Confirm the payment given the clientSecret
  // from the payment intent that was just created on
  // the server.
  const {error: stripeError} = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: `${window.location.origin}/samples/payment/complete`,
    }
  });
  if (stripeError) {
    setMessage(stripeError.message as string);
    return;
  }
}

// サブスクリプションのキャンセル
const cancelSubscription = async () => {
  console.log('--- cancelSubscription() ---')

  // Subscription キャンセルを実行
  stripeStore.cancelSubscription(subscription.value.id)

  // 画面遷移
  stepName.value = 'canceled'
}

const setMessage = (message: string) => {
  // const messageDiv = document.querySelector('#messages');
  // messageDiv.innerHTML += "<br>" + message;
  messages.value.push(message)
}
</script>

<template>
  <div class="container mx-auto w-screen bg-inherit">
    <VccHeader />

    <div class="border p-3 my-3" v-if="stepName === 'create1'">
      <h1 class="mb-3 text-xl font-bold">支払いフォーム</h1>

      <div class="">
        <div class="">
          <label class="">氏名</label>
          <span class="p-2 m-2 text-xl">{{ name }}</span>
        </div>

        <div class="">
          <label class="">商品:</label>
          <div class="p-3 m-3 border w-64 h-32" v-for="(item) in prices" :key="item.id">
            <div class="font-bold">{{ item.product.name }}</div>
            <div class="font-bold">
              {{ item.unit_amount }}
              {{ item.currency === 'jpy' ? '円' : item.currency }}
              / {{ item.recurring.interval === 'month' ? '月' : item.recurring.interval === 'year' ? '年' : item.recurring.interval }}
            </div>
            <form @submit.prevent="submitSubscribe1(item.id)">
              <ButtonGeneralPrimary type="submit">
                選択
              </ButtonGeneralPrimary>
            </form>
          </div>
        </div>

        <div id="messages">
          <div v-for="(item, index) in messages" :key="index">
            {{ item }}
          </div>
        </div>
      </div>
    </div>

    <div class="border p-3 my-3" v-else-if="stepName === 'create2'">
      <h1 class="mb-3 text-xl font-bold">支払いフォーム</h1>

      <div class="">
        <form id="subscribe-form" @submit.prevent="submitSubscribe2">
          <div class="p-3 my-3 border">
            <label class="">商品:</label>
            <div class="">
              <!-- <div class="">id: <span class="font-bold">{{ priceSelected.id }}</span></div> -->
              <div class="">product name: <span class="font-bold">{{ priceSelected.product.name }}</span></div>
              <div class="">product price:
                <span class="font-bold">
                  {{ priceSelected.unit_amount }}
                  {{ priceSelected.currency === 'jpy' ? '円' : priceSelected.currency }}
                  / {{ priceSelected.recurring.interval === 'month' ? '月' : priceSelected.recurring.interval === 'year' ? '年' : priceSelected.recurring.interval }}
                </span>
              </div>
            </div>
          </div>

          <div id="link-authentication-element">
            <!-- Elements will create authentication element here -->
          </div>
          <div id="payment-element" style="max-width: 500px;">
            <!-- Elements will create form elements here -->
          </div>

          <ButtonGeneralPrimary class="my-3" type="submit" :disabled="isLoading">
            申し込み実行
          </ButtonGeneralPrimary>

          <div id="messages">
            <div v-for="(item, index) in messages" :key="index">
              {{ item }}
            </div>
          </div>
        </form>
      </div>
    </div>

    <div class="border p-3 my-3" v-else-if="stepName === 'available'">
      <h1 class="mb-3 text-xl font-bold">サブスクリプション</h1>

      <div class="">
        <div class="my-3">
          <div class="">object: {{ subscription.object }}</div>
          <div class="">サブスクリプションID: {{ subscription.id }}</div>
          <div class="">サービス名: {{ subscription.status }}</div>
          <div class="">サービス開始日: {{ dayjs(subscription.start_date * 1000).format('YYYY-MM-DD') }}</div>
          <div class="">現在の期間: {{ dayjs(subscription.current_period_start * 1000).format('YYYY-MM-DD') }} 〜 {{ dayjs(subscription.current_period_end * 1000).format('YYYY-MM-DD') }}</div>
          <div class="">状態: {{ subscription.status }}</div>
        </div>

        <div class="my-3">
          <ButtonGeneralPrimary @click="cancelSubscription">
            サブスクリプションをキャンセル
          </ButtonGeneralPrimary>
        </div>

        <div class="my-3">
          <h2 class="mb-3 font-bold">請求書</h2>

          <table class="border">
            <thead>
              <tr>
                <th class="p-2 border">金額</th>
                <th class="p-2 border">頻度</th>
                <th class="p-2 border">作成日</th>
                <th class="p-2 border">請求書番号</th>
                <th class="p-2 border">顧客のメールアドレス</th>
                <th class="p-2 border">請求書</th>
              </tr>
            </thead>
            <tbody>
              <tr class="" v-for="item in invoices" :key="item.id">
                <td class="p-2 border">{{ item.amount_due }} {{ item.currency }} {{ item.paid ? '支払い済み' : '未払い' }}</td>
                <td class="p-2 border">-</td>
                <td class="p-2 border">{{ dayjs(item.created * 1000).format('YYYY-MM-DD') }}</td>
                <td class="p-2 border">{{ item.number }}</td>
                <td class="p-2 border">{{ item.customer_email }}</td>
                <td class="p-2 border">
                  <a :href="item.hosted_invoice_url" class="underline text-blue-500" target="_blank">URL</a>
                  / <a :href="item.invoice_pdf" class="underline text-blue-500" target="_blank">ダウンロード</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="border p-3 my-3" v-else-if="stepName === 'canceled'">
      <h1 class="mb-3 text-xl font-bold">サブスクリプション</h1>

      <div class="">
        キャンセルしました。
      </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
</style>
