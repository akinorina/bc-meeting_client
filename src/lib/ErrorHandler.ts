// Error Handler
import type { ComponentPublicInstance } from 'vue'

export async function errorHandler(
  err: unknown,
  instance: ComponentPublicInstance | null,
  // `info` は Vue 特有のエラー情報です。
  // 例 エラーが throw されたのはどのライフサイクルフックか
  info: string
) {
  console.error('<< error handler >>')
  console.error('err', err)
  console.error('instance', instance)
  console.error('info', info)
}
