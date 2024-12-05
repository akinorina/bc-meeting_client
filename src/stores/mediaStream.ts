import { ref } from 'vue'
import { defineStore } from 'pinia'
// import '@mediapipe/selfie_segmentation'
// import '@tensorflow/tfjs-core'
// import '@tensorflow/tfjs-backend-webgl'
// import * as bodySegmentation from '@tensorflow-models/body-segmentation'
import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from '@mediapipe/tasks-vision'

export const useMediaStreamStore = defineStore('media-stream', () => {
  // 出力 media stream
  const mediaStreamNormal = ref<MediaStream>()
  const mediaStreamAltText = ref<MediaStream>()
  const mediaStreamVbg = ref<MediaStream>()

  // Camera動画用 Video
  let videoVbg: HTMLVideoElement
  const mediastreamCam = ref<MediaStream>()

  // 出力する動画用 Canvas
  const canvasVbg = ref<HTMLCanvasElement>()
  const ctxVbg = ref<CanvasRenderingContext2D>()
  const ctxOption = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  }

  // 背景画像 Img & Canvas
  const virtualMode = ref<'normal' | 'alt-text' | 'blur' | 'image'>('blur')
  const bgImageUrl = ref('')
  let imgBg: HTMLImageElement
  let canvasBg: HTMLCanvasElement
  let ctxBg: CanvasRenderingContext2D

  // バックグラウンド分割`処理用
  let requestIdVb = 0
  let imageSegmenter: ImageSegmenter

  // 背景ぼかし効果値
  const backgroundBlur = ref(10)
  const canvasBlur = ref<HTMLCanvasElement>()
  const ctxBlur = ref<CanvasRenderingContext2D>()

  // MediaStream 代替テキスト用
  const altText = ref('')
  const canvasAlt = ref<HTMLCanvasElement>()
  const ctxAlt = ref<CanvasRenderingContext2D>()
  const requestIdAltText = ref(0)

  // 動作 | 停止
  const webcamRunning = ref(false)
  let lastWebcamTime = -1

  // normal: mediaStream 作成
  async function openNormal(mediaStreamConstraints: MediaStreamConstraints) {
    // 対応待ち設定
    let waitingId
    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve, reject) => {
      waitingId = setTimeout(() => {
        reject(new Error('coud not get a User Media.'))
      }, 3000)

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
        } else if (
          err.name == 'OverconstrainedError' ||
          err.name == 'ConstraintNotSatisfiedError'
        ) {
          // constraints can not be satisfied by avb. devices
          console.error('Constraints can not be satisfied by available devices')
        } else if (err.name == 'NotAllowedError' || err.name == 'PermissionDeniedError') {
          // permission denied in browser
          console.error('Permission Denied.')
        } else if (err.name == 'TypeError' || err.name == 'TypeError') {
          // empty constraints object
          console.error('Both audio and video are FALSE')
        } else if (err.message === 'coud not get a User Media.') {
          console.log('--- throw errr ')
          throw err
        } else {
          // other errors
          console.error('Sorry! Another error occurred.')
        }
      }

      // 対応待ちCLEAR
      clearTimeout(waitingId)

      resolve(0)
    })
  }

  // 代替テキスト: mediaStream 作成
  function openAltText() {
    canvasAlt.value = document.createElement('canvas') as HTMLCanvasElement
    canvasAlt.value.width = ctxOption.width
    canvasAlt.value.height = ctxOption.height
    ctxAlt.value = canvasAlt.value.getContext('2d') as CanvasRenderingContext2D
    mediaStreamAltText.value = canvasAlt.value.captureStream(30)

    // テキストCanvas描画
    drawText()
  }

  // 代替テキスト: mediaStream 描画
  function drawText() {
    if (!ctxAlt.value) return false
    ctxAlt.value.clearRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctxAlt.value.fillStyle = 'black'
    ctxAlt.value.fillRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctxAlt.value.font = '100px sans-serif'
    ctxAlt.value.fillStyle = 'white'
    ctxAlt.value.textAlign = 'center'
    ctxAlt.value.textBaseline = 'bottom'
    ctxAlt.value.fillText(altText.value, ctxOption.width / 2, ctxOption.height / 2)
    requestIdAltText.value = window.requestAnimationFrame(drawText)
  }

  // バーチャル背景: mediaStream 作成
  async function openVirtualBackground(mediaStreamConstraints: MediaStreamConstraints) {
    // Camera動画
    videoVbg = document.createElement('video') as HTMLVideoElement

    // 出力用動画
    canvasVbg.value = document.createElement('canvas') as HTMLCanvasElement
    canvasVbg.value.width = ctxOption.width
    canvasVbg.value.height = ctxOption.height
    ctxVbg.value = canvasVbg.value.getContext('2d') as CanvasRenderingContext2D

    // ぼかし用
    canvasBlur.value = document.createElement('canvas') as HTMLCanvasElement
    canvasBlur.value.width = ctxOption.width
    canvasBlur.value.height = ctxOption.height
    ctxBlur.value = canvasBlur.value.getContext('2d') as CanvasRenderingContext2D
    ctxBlur.value.filter = 'blur(' + backgroundBlur.value + 'px)'

    // カメラからの映像ストリームを取得し、ビデオ要素にセット
    mediastreamCam.value = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    videoVbg.srcObject = mediastreamCam.value
    videoVbg.play()
    videoVbg.muted = true

    // ビデオのメタデータが読み込まれたら、キャンバスのサイズを設定し初期化
    // 背景画像
    if (virtualMode.value === 'image') {
      loadBackgroundImage()
    }

    videoVbg.onloadedmetadata = () => {
      initBodySegmentation()
    }

    mediaStreamVbg.value = canvasVbg.value.captureStream(30)
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
    // フレーム処理の開始
    webcamRunning.value = true

    // ボディセグメンテーションモデルの作成
    await createBodySegmentation()

    switch (virtualMode.value) {
      case 'blur':
        // background blur
        processFrameBlur()
        break
      case 'image':
        // background virtual image
        processFrameVirtual()
        break
    }
  }

  // バーチャル背景: バックグラウンド作成
  const createBodySegmentation = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
    )

    // [画像セグメンテーション]: 生成
    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      outputCategoryMask: true,
      outputConfidenceMasks: false
    })

    // [画像セグメンテーション]: 初期設定
    imageSegmenter.setOptions({ runningMode: 'VIDEO' })
  }

  // バーチャル背景: ぼかし描画
  const processFrameBlur = async () => {
    if (!videoVbg || !ctxVbg.value || !ctxBlur.value) return

    if (videoVbg.currentTime === lastWebcamTime) {
      if (webcamRunning.value) {
        requestIdVb = window.requestAnimationFrame(processFrameBlur)
      }
      return
    }
    lastWebcamTime = videoVbg.currentTime

    // Video映像 => Canvas 描画
    ctxVbg.value.drawImage(videoVbg, 0, 0, videoVbg.videoWidth, videoVbg.videoHeight)

    // Video映像 => ぼかし用 Canvas 描画
    ctxBlur.value.drawImage(videoVbg, 0, 0, videoVbg.videoWidth, videoVbg.videoHeight)

    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
      return
    }

    const startTimeMs = performance.now()

    // [画像セグメンテーション]: 開始
    // Start segmenting the stream.
    imageSegmenter.segmentForVideo(videoVbg, startTimeMs, callbackForVideoBlur)
  }
  const callbackForVideoBlur = async (result: ImageSegmenterResult) => {
    if (!videoVbg || !ctxVbg.value || !ctxBlur.value || !result.categoryMask) return

    // Canvas 画像 => imageData
    const imageData = ctxVbg.value.getImageData(
      0,
      0,
      videoVbg.videoWidth,
      videoVbg.videoHeight
    ).data

    // ぼかしバックグラウンド画像データ
    const imageBlur = ctxBlur.value.getImageData(
      0,
      0,
      videoVbg.videoWidth,
      videoVbg.videoHeight
    ).data
    // // バックグラウンド画像 原画データ
    // const imageDataBg = ctxBg.getImageData(0, 0, videoVbg.videoWidth, videoVbg.videoHeight).data

    // [画像セグメンテーション]: 判定結果 => imageData 加工 => dataNew
    const mask = result.categoryMask.getAsFloat32Array()
    let j = 0
    for (let i = 0; i < mask.length; ++i) {
      const maskVal = Math.floor(mask[i] * 255.0)
      if (maskVal < 10) {
        // バーチャル背景画像 貼り付け
        imageData[j] = imageBlur[j]
        imageData[j + 1] = imageBlur[j + 1]
        imageData[j + 2] = imageBlur[j + 2]
        imageData[j + 3] = imageBlur[j + 3]
      }
      j += 4
    }
    const uint8Array = new Uint8ClampedArray(imageData.buffer)
    const dataNew = new ImageData(uint8Array, videoVbg.videoWidth, videoVbg.videoHeight)

    // imageData 加工 => Canvas画像
    ctxVbg.value.putImageData(dataNew, 0, 0)

    if (webcamRunning.value) {
      requestIdVb = window.requestAnimationFrame(processFrameBlur)
    }
  }

  // バーチャル背景: 背景描画
  const processFrameVirtual = async () => {
    if (!videoVbg || !ctxVbg.value) return

    if (videoVbg.currentTime === lastWebcamTime) {
      if (webcamRunning.value) {
        requestIdVb = window.requestAnimationFrame(processFrameVirtual)
      }
      return
    }
    lastWebcamTime = videoVbg.currentTime

    // Video映像 => Canvas 描画
    ctxVbg.value.drawImage(videoVbg, 0, 0, videoVbg.videoWidth, videoVbg.videoHeight)

    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
      return
    }

    const startTimeMs = performance.now()

    // [画像セグメンテーション]: 開始
    // Start segmenting the stream.
    imageSegmenter.segmentForVideo(videoVbg, startTimeMs, callbackForVideo)
  }
  const callbackForVideo = async (result: ImageSegmenterResult) => {
    if (!videoVbg || !ctxVbg.value || !result.categoryMask) return

    // Canvas 画像 => imageData
    const imageData = ctxVbg.value.getImageData(
      0,
      0,
      videoVbg.videoWidth,
      videoVbg.videoHeight
    ).data

    // バックグラウンド画像 原画データ
    const imageDataBg = ctxBg.getImageData(0, 0, videoVbg.videoWidth, videoVbg.videoHeight).data

    // [画像セグメンテーション]: 判定結果 => imageData 加工 => dataNew
    const mask = result.categoryMask.getAsFloat32Array()
    let j = 0
    for (let i = 0; i < mask.length; ++i) {
      const maskVal = Math.floor(mask[i] * 255.0)
      if (maskVal < 10) {
        // バーチャル背景画像 貼り付け
        imageData[j] = imageDataBg[j]
        imageData[j + 1] = imageDataBg[j + 1]
        imageData[j + 2] = imageDataBg[j + 2]
        imageData[j + 3] = imageDataBg[j + 3]
      }
      j += 4
    }
    const uint8Array = new Uint8ClampedArray(imageData.buffer)
    const dataNew = new ImageData(uint8Array, videoVbg.videoWidth, videoVbg.videoHeight)

    // imageData 加工 => Canvas画像
    ctxVbg.value.putImageData(dataNew, 0, 0)

    if (webcamRunning.value) {
      requestIdVb = window.requestAnimationFrame(processFrameVirtual)
    }
  }

  // normal: mediaStream 削除
  const closeNormal = async () => {
    mediaStreamNormal.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamNormal.value?.removeTrack(tr)
    })
  }

  // alttext: mediaStream 削除
  const closeAltText = () => {
    // 描画停止
    window.cancelAnimationFrame(requestIdAltText.value)

    mediaStreamAltText.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamAltText.value?.removeTrack(tr)
    })
  }

  // Virtual Background: mediaStream 削除
  const closeVirtualBackground = async () => {
    // requestAnimationFrame() 停止
    webcamRunning.value = false
    window.cancelAnimationFrame(requestIdVb)

    // mediaStream 停止
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
    virtualMode,
    mediaStreamVbg,
    backgroundBlur,
    bgImageUrl,
    openVirtualBackground,
    closeVirtualBackground,
    loadBackgroundImage
  }
})
