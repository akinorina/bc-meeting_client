import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'
import User from '@/lib/User'

export const useUserStore = defineStore('user', () => {
  const user = ref<User>(new User())
  const users = ref<User[]>([])

  // パスワード変更用
  const oldPassword = ref('')
  const newPassword = ref('')

  // Emailアドレス確認
  const unverifiedEmail = ref('')

  // パスワード・リセット
  const email = ref('')
  const hash = ref('')

  async function getUsers() {
    users.value = []
    const options = {}
    const response = await axios.get('/api/users', options)
    users.value = response.data
  }

  async function newUser() {
    user.value = new User()
  }

  async function createUser() {
    const options = user.value
    await axios.post('/api/users', options)
  }

  async function getUser(id: number) {
    user.value = new User()
    const options = {}
    const response = await axios.get('/api/users/' + id, options)
    user.value = new User(response.data)
  }

  async function updateUser(id: number) {
    const options = user.value
    await axios.put('/api/users/' + id, options)
  }

  async function deleteUser(id: number) {
    const options = {}
    await axios.delete('/api/users/' + id, options)
  }

  async function changePassword() {
    const options = {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    }
    await axios.put('/api/users/change-password', options)
  }

  async function verifyingEmail(nextPageUrlPath: string) {
    // メールアドレス確認
    const options = {
      email: unverifiedEmail.value,
      next_url_path: nextPageUrlPath
    }
    await axios.post('/api/users/verifing-email', options)
  }

  async function registerUser() {
    // ユーザー登録
    await axios.post('/api/users/register-user', user.value)
  }

  async function resetPassword() {
    // パスワード更新
    const options = {
      email: email.value,
      hash: hash.value,
      password: newPassword.value
    }
    await axios.post('/api/users/reset-password', options)
  }

  return {
    user,
    users,
    oldPassword,
    newPassword,
    unverifiedEmail,
    email,
    hash,
    getUsers,
    getUser,
    newUser,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    verifyingEmail,
    registerUser,
    resetPassword
  }
})
