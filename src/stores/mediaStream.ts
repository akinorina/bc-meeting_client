import { ref } from 'vue'
import { defineStore } from 'pinia'
import '@mediapipe/selfie_segmentation'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'
import * as bodySegmentation from '@tensorflow-models/body-segmentation'

export const useMediaStreamStore = defineStore('media-stream', () => {
  // 出力 media stream
  const mediaStreamNormal = ref<MediaStream>()
  const mediaStreamAltText = ref<MediaStream>()
  const mediaStreamVbg = ref<MediaStream>()

  // Camera動画用 Video
  let video: HTMLVideoElement
  const mediastreamCam = ref<MediaStream>()

  // 出力する動画用 Canvas
  const canvas = ref<HTMLCanvasElement>()
  const ctx = ref<CanvasRenderingContext2D>()
  const ctxOption = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  }

  // 背景画像 Img & Canvas
  const bgImageUrl = ref('')
  let imgBg: HTMLImageElement
  let canvasBg: HTMLCanvasElement
  let ctxBg: CanvasRenderingContext2D

  // ボディー分割処理用
  let segmenter: bodySegmentation.BodySegmenter
  let requestIdVb = 0

  // MediaStream 代替テキスト用
  const altText = ref('')
  let requestIdAltText = 0

  // normal: mediaStream 作成
  async function openNormal(mediaStreamConstraints: MediaStreamConstraints) {
    try {
      mediaStreamNormal.value = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    } catch (err: any) {
      console.error('Failed to get local stream', err)

      // log to console first
      console.error(err) /* handle the error */
      if (err.name == 'NotFoundError' || err.name == 'DevicesNotFoundError') {
        // required track is missing
        console.error('Required track is missing')
      } else if (err.name == 'NotReadableError' || err.name == 'TrackStartError') {
        // webcam or mic are already in use
        console.error('Webcam or mic are already in use')
      } else if (err.name == 'OverconstrainedError' || err.name == 'ConstraintNotSatisfiedError') {
        // constraints can not be satisfied by avb. devices
        console.error('Constraints can not be satisfied by available devices')
      } else if (err.name == 'NotAllowedError' || err.name == 'PermissionDeniedError') {
        // permission denied in browser
        console.error('Permission Denied.')
      } else if (err.name == 'TypeError' || err.name == 'TypeError') {
        // empty constraints object
        console.error('Both audio and video are FALSE')
      } else {
        // other errors
        console.error('Sorry! Another error occurred.')
      }
    }
  }

  // 代替テキスト: mediaStream 作成
  async function openAltText() {
    canvas.value = document.createElement('canvas') as HTMLCanvasElement
    canvas.value.width = ctxOption.width
    canvas.value.height = ctxOption.height
    ctx.value = canvas.value.getContext('2d') as CanvasRenderingContext2D
    mediaStreamAltText.value = canvas.value.captureStream()

    // テキストCanvas描画
    drawText()
  }

  // 代替テキスト: mediaStream 描画
  function drawText() {
    if (!ctx.value) return false
    ctx.value.clearRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctx.value.fillStyle = 'black'
    ctx.value.fillRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctx.value.font = '100px sans-serif'
    ctx.value.fillStyle = 'white'
    ctx.value.textAlign = 'center'
    ctx.value.textBaseline = 'bottom'
    ctx.value.fillText(altText.value, ctxOption.width / 2, ctxOption.height / 2)
    requestIdAltText = window.requestAnimationFrame(drawText)
  }

  // バーチャル背景: mediaStream 作成
  async function openVirtualBackground(mediaStreamConstraints: MediaStreamConstraints) {
    // Camera動画
    video = document.createElement('video') as HTMLVideoElement

    // 出力用動画
    canvas.value = document.createElement('canvas') as HTMLCanvasElement
    canvas.value.width = ctxOption.width
    canvas.value.height = ctxOption.height
    ctx.value = canvas.value.getContext('2d') as CanvasRenderingContext2D

    // カメラからの映像ストリームを取得し、ビデオ要素にセット
    mediastreamCam.value = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    video.srcObject = mediastreamCam.value
    video.play()
    video.muted = true

    // ビデオのメタデータが読み込まれたら、キャンバスのサイズを設定し初期化
    // 背景画像
    if (bgImageUrl.value !== '') {
      loadBackgroundImage()
    }

    video.onloadedmetadata = () => {
      initBodySegmentation()
    }

    mediaStreamVbg.value = canvas.value.captureStream(30)
  }

  // バーチャル背景: 背景画像 読み込み (再実行することで画像差し替え可能)
  function loadBackgroundImage() {
    imgBg = document.createElement('img')
    imgBg.src = bgImageUrl.value
    canvasBg = document.createElement('canvas') as HTMLCanvasElement
    canvasBg.width = ctxOption.width
    canvasBg.height = ctxOption.height
    ctxBg = canvasBg.getContext('2d') as CanvasRenderingContext2D
    imgBg.addEventListener('load', () => {
      ctxBg.drawImage(imgBg, 0, 0, ctxOption.width, ctxOption.height)
    })
  }

  // バーチャル背景: 初期化
  async function initBodySegmentation() {
    // ボディセグメンテーションモデルの作成
    await createBodySegmentation()

    // フレーム処理の開始
    if (bgImageUrl.value === '') {
      // blur
      processFrameBlur()
    } else {
      // virtual background image
      processFrameVirtual()
    }
  }

  // バーチャル背景: ぼかし描画
  const processFrameBlur = async () => {
    if (!video || !canvas.value) return // processFrame()

    // 人物のセグメンテーションを実行
    const segmentation = await segmentPeople()

    const foregroundThreshold = 0.5
    const backgroundBlurAmount = 20
    const edgeBlurAmount = 3
    const flipHorizontal = false
    await bodySegmentation.drawBokehEffect(
      canvas.value,
      video,
      segmentation,
      foregroundThreshold,
      backgroundBlurAmount,
      edgeBlurAmount,
      flipHorizontal
    )

    requestIdVb = window.requestAnimationFrame(processFrameBlur)
  }

  // バーチャル背景: 背景描画
  const processFrameVirtual = async () => {
    if (!video || !canvas.value || !ctx.value) return // processFrame()

    // 人物のセグメンテーションを実行
    const segmentation = await segmentPeople()

    const foregroundColor = { r: 12, g: 12, b: 12, a: 12 }
    const backgroundColor = { r: 16, g: 16, b: 16, a: 16 }
    const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
      segmentation,
      foregroundColor,
      backgroundColor
    )

    const opacity = 1.0
    const maskBlurAmount = 10
    const flipHorizontal = false
    await bodySegmentation.drawMask(
      canvas.value,
      video,
      backgroundDarkeningMask,
      opacity,
      maskBlurAmount,
      flipHorizontal
    )

    const mask = backgroundDarkeningMask
    const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)

    ctxBg.drawImage(imgBg, 0, 0, canvas.value.width, canvas.value.height)
    const imageDataBg = ctxBg.getImageData(0, 0, canvas.value.width, canvas.value.height)

    // マスクを使用して背景ピクセルを透明に設定
    for (let i = 0; i < imageData.data.length; i += 4) {
      const maskValue = mask.data[i]
      if (maskValue > 12) {
        // // 閾値を調整して結果を改善できます
        // imageData.data[i + 3] = 0 // アルファチャンネルを0に設定して透明にする
        // 背景画像を貼る
        imageData.data[i + 0] = imageDataBg.data[i + 0]
        imageData.data[i + 1] = imageDataBg.data[i + 1]
        imageData.data[i + 2] = imageDataBg.data[i + 2]
        imageData.data[i + 3] = imageDataBg.data[i + 3]
      }
    }

    // 処理後の画像データをキャンバスに描画
    ctx.value.putImageData(imageData, 0, 0)

    requestIdVb = window.requestAnimationFrame(processFrameVirtual)
  }

  // バーチャル背景: ボディー分割作成
  const createBodySegmentation = async () => {
    // ボディセグメンテーションモデルの設定
    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation
    const segmenterConfig: bodySegmentation.MediaPipeSelfieSegmentationMediaPipeModelConfig = {
      runtime: 'mediapipe' as const,
      solutionPath: '/node_modules/@mediapipe/selfie_segmentation',
      modelType: 'general'
    }
    // セグメンターの作成
    segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig)
  }

  // バーチャル背景: 人物分割
  const segmentPeople = async () => {
    // ビデオフレームから人物のセグメンテーションを実行
    const estimationConfig = { flipHorizontal: false }
    return await segmenter.segmentPeople(video, estimationConfig)
  }

  // normal: mediaStream 削除
  const closeNormal = async () => {
    mediaStreamNormal.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamNormal.value?.removeTrack(tr)
    })
  }

  const closeAltText = async () => {
    // 描画停止
    window.cancelAnimationFrame(requestIdAltText)

    mediaStreamAltText.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamAltText.value?.removeTrack(tr)
    })
  }

  const closeVirtualBackground = async () => {
    // requestAnimationFrame() 停止
    window.cancelAnimationFrame(requestIdVb)

    mediastreamCam.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediastreamCam.value?.removeTrack(tr)
    })

    mediaStreamVbg.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamVbg.value?.removeTrack(tr)
    })
  }

  return {
    // normal
    mediaStreamNormal,
    openNormal,
    closeNormal,

    // alternative text
    mediaStreamAltText,
    altText,
    openAltText,
    closeAltText,

    // virtual background
    mediaStreamVbg,
    bgImageUrl,
    openVirtualBackground,
    closeVirtualBackground,
    loadBackgroundImage
  }
})
