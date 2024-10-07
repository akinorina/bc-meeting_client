import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { axios } from '@/lib/Axios'
import Profile from '@/lib/Profile'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // Sign-in 変数
  const email = ref('')
  const password = ref('')

  // setInterval ID.
  let iID: number = 0

  // Profile
  const profile = ref<Profile>(new Profile())

  // restore from localStorage
  if (localStorage.getItem('auth')) {
    const jsonLsData = localStorage.getItem('auth')
    if (typeof jsonLsData === 'string') {
      const lsData = JSON.parse(jsonLsData)
      axios.defaults.headers['Authorization'] = 'Bearer ' + lsData.access_token
      profile.value = new Profile(lsData)
    }
  }

  // ユーザー表示名 取得
  const getUsername = () => {
    return profile.value.username
  }

  // サインイン有効期限内 判定
  const isAuthenticated = () => {
    return dayjs().isBefore(dayjs(profile.value.exp))
  }

  // 時間切れ処理 on reload.
  if (isAuthenticated()) {
    setTimeoutProc()
  }

  async function signIn() {
    // sign-in
    const signinData = {
      email: email.value,
      password: password.value
    }
    const res = await axios.post('/api/auth/signin', signinData)
    axios.defaults.headers['Authorization'] = 'Bearer ' + res.data.access_token

    // get profle
    const res2 = await getProfile()

    // set Profile obj.
    profile.value.set({
      access_token: res.data.access_token,
      username: res2.data.username,
      email: res2.data.email,
      iat: res2.data.iat,
      exp: res2.data.exp
    })

    // save to localStorage
    localStorage.setItem('auth', JSON.stringify(profile.value))

    // 時間切れ処理
    setTimeoutProc()
  }

  async function signInByGoogle() {
    location.href = '/api/auth/signin-google'
  }

  async function signInByGoogleRedirect(query: any) {
    if (query.access_token === 'no_user_from_google') {
      return false // Sign-in failure
    }
    axios.defaults.headers['Authorization'] = 'Bearer ' + query.access_token

    // get profle
    const res2 = await getProfile()

    // set Profile obj.
    profile.value.set({
      access_token: query.access_token,
      username: res2.data.username,
      email: res2.data.email,
      iat: res2.data.iat,
      exp: res2.data.exp
    })

    // save to localStorage
    localStorage.setItem('auth', JSON.stringify(profile.value))

    // 時間切れ処理
    setTimeoutProc()

    return true // Sign-in ok
  }

  async function signOut() {
    // sign-out
    await axios.post('/api/auth/signout', {})
    // reset values
    axios.defaults.headers['Authorization'] = null
    profile.value.clear()
    clearInterval(iID)
    localStorage.removeItem('auth')
  }

  async function getProfile() {
    return await axios.get('/api/auth/profile')
  }

  function getExpiredTime(): string {
    return dayjs(profile.value.exp).format('YYYY-MM-DD HH:mm:ss')
  }

  function setTimeoutProc() {
    // 時間切れ処理
    iID = window.setInterval(() => {
      if (!isAuthenticated()) {
        axios.defaults.headers['Authorization'] = null
        profile.value.clear()
        clearInterval(iID)
        localStorage.removeItem('auth')
        router.push({ name: 'sign-out' })
      }
    }, 1000)
  }

  return {
    email,
    password,
    getUsername,
    isAuthenticated,
    signIn,
    signInByGoogle,
    signInByGoogleRedirect,
    signOut,
    getProfile,
    getExpiredTime
  }
})
