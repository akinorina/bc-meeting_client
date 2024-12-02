export class BackgroundSetting {
  label: string = ''
  type: 'normal' | 'alt-text' | 'blur' | 'image' = 'normal'
  blur: number = 0
  url: string = ''
}
interface BackgroundSettingObject {
  [key: string]: BackgroundSetting
}
