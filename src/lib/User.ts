/**
 * User data class
 */
export default class User {
  // ID
  id: number = 0

  // ユーザー名
  username: string = ''

  // 姓
  familyname: string = ''

  // 名
  firstname: string = ''

  // 姓かな
  familynameKana: string = ''

  // 名かな
  firstnameKana: string = ''

  // メールアドレス
  email: string = ''

  // メールアドレス確認 hash
  email_hash: string = ''

  // パスワード
  password: string = ''

  constructor(user: any = {}) {
    this.id = user.id ?? 0
    this.username = user.username
    this.familyname = user.familyname
    this.firstname = user.firstname
    this.familynameKana = user.familynameKana
    this.firstnameKana = user.firstnameKana
    this.email = user.email
    this.email_hash = user.email_hash
    this.password = user.password
  }
}
