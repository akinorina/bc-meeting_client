/**
 * Blog data class
 */
export default class Blog {
  // ID
  id: number = 0

  // 表題
  subject: string = ''

  // 本文
  body: string = ''

  constructor(blog: any = {}) {
    this.id = blog.id ?? 0
    this.subject = blog.subject
    this.body = blog.body
  }
}
