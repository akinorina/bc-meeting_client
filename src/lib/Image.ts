/**
 * Image data class
 */
export default class Image {
  // ID
  id: number = 0

  // 画像表示名
  name: string = ''

  // 画像ファイル名
  originalname: string = ''

  // 画像 mime-type
  mimetype: string = ''

  // 画像データ
  data: string = ''

  // Bucket名
  bucket: string = ''

  // オブジェクトキー
  objectKey: string = ''

  // PATH
  path: string = ''

  constructor(image: any = {}) {
    this.id = image.id ?? 0
    this.name = image.name
    this.originalname = image.originalname
    this.mimetype = image.mimetype
    this.data = image.data
    this.bucket = image.bucket
    this.objectKey = image.objectKey
    this.path = image.path
  }
}
