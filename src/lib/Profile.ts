export default class Profile {
  // API Access Token
  access_token: string | null = null

  // ユーザー 表示名
  username: string = ''

  // ユーザー メールアドレス
  email: string = ''

  // サインイン日時
  iat: number = 0

  // サインイン有効期限日時
  exp: number = 0

  constructor(profile: any = {}) {
    this.access_token = profile.access_token ?? ''
    this.username = profile.username ?? ''
    this.email = profile.email ?? ''
    this.iat = profile.iat ?? 0
    this.exp = profile.exp ?? 0
  }

  set(profile: any = {}) {
    this.access_token = profile.access_token ?? ''
    this.username = profile.username ?? ''
    this.email = profile.email ?? ''
    this.iat = profile.iat ?? 0
    this.exp = profile.exp ?? 0
  }

  clear() {
    this.access_token = null
    this.username = ''
    this.email = ''
    this.iat = 0
    this.exp = 0
  }
}
