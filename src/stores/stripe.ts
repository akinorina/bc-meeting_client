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
   * Subscription(サブスクリプション) - 一覧取得
   */
  async function listSubscription(customerId: string, priceId: string) {
    let url = '/api/stripe/list-subscription?customer=' + customerId
    url += priceId ? '&price=' + priceId : ''
    const options = {}
    const res = await axios.get(url, options)
    return res.data
  }

  /**
   * Subscription(サブスクリプション) - キャンセル
   */
  async function cancelSubscription(subscriptionId: string) {
    try {
      const options = {}
      const response = await axios.post(
        '/api/stripe/cancel-subscription/' + subscriptionId,
        options
      )
      console.log('response', response)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  /**
   * Invoices(請求書) - 一覧取得
   */
  async function listInvoices(subscriptionId: string) {
    try {
      const options = {}
      const response = await axios.get('/api/stripe/list-invoice/' + subscriptionId, options)
      console.log('response', response)
      return response.data
    } catch (err: any) {
      console.error(err.message)
    }
  }

  return {
    getConfig,
    getPrices,
    createCustomer,
    listCustomer,
    createSubscription,
    listSubscription,
    cancelSubscription,
    listInvoices
  }
})
