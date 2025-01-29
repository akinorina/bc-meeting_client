import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStreamAlttextStore = defineStore('media-stream-alttext', () => {
  // 出力 media stream
  const mediaStreamAltText = ref<MediaStream>(new MediaStream())

  // Canvas options
  const ctxOption = {
    x: 0,
    y: 0,
    width: 640, // 1280, // 1920,
    height: 360 // 720 // 1080
  }

  // MediaStream 代替テキスト用
  const altText = ref('')
  const canvasAlt = ref<HTMLCanvasElement>()
  const ctxAlt = ref<CanvasRenderingContext2D>()
  const requestIdAltText = ref(0)

  // mediaStream 作成
  function openMediaStream() {
    canvasAlt.value = document.createElement('canvas') as HTMLCanvasElement
    canvasAlt.value.width = ctxOption.width
    canvasAlt.value.height = ctxOption.height
    ctxAlt.value = canvasAlt.value.getContext('2d') as CanvasRenderingContext2D
    mediaStreamAltText.value = canvasAlt.value.captureStream(30)

    // テキストCanvas描画
    drawText()
  }

  // mediaStream 描画
  function drawText() {
    if (!ctxAlt.value) return false
    ctxAlt.value.clearRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctxAlt.value.fillStyle = 'black'
    ctxAlt.value.fillRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctxAlt.value.font = '50px sans-serif'
    ctxAlt.value.fillStyle = 'white'
    ctxAlt.value.textAlign = 'center'
    ctxAlt.value.textBaseline = 'bottom'
    ctxAlt.value.fillText(altText.value, ctxOption.width / 2, ctxOption.height / 2)
    requestIdAltText.value = window.requestAnimationFrame(drawText)
  }

  // mediaStream 取得
  const getMediaStream = () => {
    return mediaStreamAltText.value
  }

  // mediaStream 削除
  const closeMediaStream = async (kind: '' | 'video' | 'audio' = '') => {
    // 描画停止
    window.cancelAnimationFrame(requestIdAltText.value)
    // track削除
    let tracks = []
    switch (kind) {
      case 'video':
        tracks = mediaStreamAltText.value?.getVideoTracks() as MediaStreamTrack[]
        break
      case 'audio':
        tracks = mediaStreamAltText.value?.getAudioTracks() as MediaStreamTrack[]
        break
      default:
        tracks = mediaStreamAltText.value?.getTracks() as MediaStreamTrack[]
        break
    }
    tracks.forEach((tr) => {
      tr.stop()
      mediaStreamAltText.value?.removeTrack(tr)
    })
  }

  return {
    // properties
    altText,
    // methods
    openMediaStream,
    getMediaStream,
    closeMediaStream
  }
})
