// import { ref } from 'vue'
import { type Stripe } from '@stripe/stripe-js'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'

export const useStripeStore = defineStore('stripe', () => {
  /**
   * config情報取得
   */
  async function getConfig() {
    const options = {}
    const res = await axios.get('/api/stripe/config', options)
    return res
  }

  /**
   * Prices取得
   */
  async function getPrices() {
    const options = {}
    const res = await axios.get('/api/stripe/get-prices', options)
    return res.data
  }

  /**
   * Customer(顧客)の作成
   */
  async function createCustomer(name: string, email: string) {
    const options = { name: name, email: email }
    const res = await axios.post('/api/stripe/create-customer', options)
    return res.data
  }

  /**
   * Customer(顧客) 一覧取得
   */
  async function listCustomer(email: string) {
    const res = await axios.get('/api/stripe/list-customer?email=' + encodeURI(email))
    return res.data
  }

  /**
   * Subscription(サブスクリプション)の作成
   */
  async function createSubscription(customerId: string, priceId: string) {
    const options = {
      customerId: customerId,
      priceId: priceId
    }
    const res = await axios.post('/api/stripe/create-subscription', options)
    return res.data
  }

  /**
   * Subscription(サブスクリプション) 一覧取得
   */
  async function listSubscription(customerId: string, priceId: string) {
    let url = '/api/stripe/list-subscription?customer=' + customerId
    url += priceId ? '&price=' + priceId : ''
    const options = {}
    const res = await axios.get(url, options)
    return res.data
  }

  /**
   * Invoice(請求書) 一覧取得
   */
  async function listInvoice(subscriptionId: string) {
    const options = {}
    const res = await axios.get('/api/stripe/list-invoice?subscription=' + subscriptionId, options)
    return res.data
  }

  /**
   * create-payment-intent
   */
  async function createPaymentIntent() {
    const options = {}
    const res = await axios.get('/api/stripe/create-payment-intent', options)
    return res.data
  }

  // async function getImage(id: number) {
  //   try {
  //     image.value = new Image()
  //     const options = {}
  //     const response = await axios.get('/api/images/' + id, options)
  //     image.value = new Image(response.data)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  // async function newImage() {
  //   try {
  //     image.value = new Image()
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  // async function createImage() {
  //   try {
  //     const options = image.value
  //     await axios.post('/api/images', options)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  // async function uploadImage() {
  //   try {
  //     const options = image.value
  //     await axios.post('/api/images/upload', options)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  // async function updateImage(id: number) {
  //   try {
  //     const options = image.value
  //     await axios.put('/api/images/' + id, options)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  // async function deleteImage(id: number) {
  //   try {
  //     const options = {}
  //     await axios.delete('/api/images/' + id, options)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  return {
    getConfig,
    getPrices,
    createPaymentIntent,
    createCustomer,
    listCustomer,
    createSubscription,
    listSubscription,
    listInvoice
  }
})
