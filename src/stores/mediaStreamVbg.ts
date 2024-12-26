/*
 * バーチャル背景（画像）処理 構造
 *
 *  WebCamera & Mic
 *  ↓
 *  getUserMedia()      画像URL(file)
 *  ↓                   ↓
 *  videoVbg            imgBg
 *  ↓                   ↓
 *  ctxVbg(canvasVbg)   ctxBg(canvasBg)
 *  ↓                   ↓
 *  imageData         ← imageDataBg
 *  ↓
 *  ctxVbg(canvasVbg)
 *  ↓
 *  mediaStreamVbg (output)
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from '@mediapipe/tasks-vision'
import backgroundJson from '../assets/background.json'

export const useMediaStreamVbgStore = defineStore('media-stream-vbg', () => {
  // 出力 media stream
  const mediaStreamNormal = ref<MediaStream>()
  // const mediaStreamAltText = ref<MediaStream>()
  const mediaStreamVbg = ref<MediaStream>()

  // Camera動画用 Video
  let videoVbg: HTMLVideoElement

  // 出力する動画用 Canvas
  const canvasVbg = ref<HTMLCanvasElement>()
  const ctxVbg = ref<CanvasRenderingContext2D>()
  const ctxOption = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  }

  // 背景画像 URL(path)
  const bgImageUrl = ref(backgroundJson.image11.url)
  // 背景画像 HTML要素
  let imgBg: HTMLImageElement
  // 背景画像 Canvas
  let canvasBg: HTMLCanvasElement
  let ctxBg: CanvasRenderingContext2D

  // バックグラウンド分割`処理用
  let requestIdVb = 0
  let imageSegmenter: ImageSegmenter

  // 動作 | 停止
  const webcamRunning = ref(false)
  let lastWebcamTime = -1

  // normal: mediaStream 作成
  async function _openNormal(mediaStreamConstraints: MediaStreamConstraints) {
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

  // mediaStream 作成
  async function openMediaStream(mediaStreamConstraints: MediaStreamConstraints) {
    // 背景画像
    loadBackgroundImage()

    // バーチャル背景出力用 Canvas
    canvasVbg.value = document.createElement('canvas') as HTMLCanvasElement
    canvasVbg.value.width = ctxOption.width
    canvasVbg.value.height = ctxOption.height
    ctxVbg.value = canvasVbg.value.getContext('2d') as CanvasRenderingContext2D
    // バーチャル背景出力 mediastream
    mediaStreamVbg.value = canvasVbg.value.captureStream(30)

    // バーチャル背景出力用 Video element
    videoVbg = document.createElement('video') as HTMLVideoElement
    // カメラからの映像ストリームを取得し、ビデオ要素にセット
    await _openNormal(mediaStreamConstraints)
    videoVbg.srcObject = mediaStreamNormal.value as MediaStream
    videoVbg.play()
    videoVbg.muted = true
    videoVbg.onloadedmetadata = () => {
      initBodySegmentation()
    }
  }

  // 背景画像 読み込み => CanvasBg (再実行することで画像差し替え可能)
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

  // 画像セグメンテーション初期化 => 実行
  async function initBodySegmentation() {
    // フレーム処理の開始
    webcamRunning.value = true

    // ボディセグメンテーションモデルの作成
    await createBodySegmentation()

    // background virtual image
    processFrameVirtual()
  }

  // 画像セグメンテーション生成
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

  // バーチャル背景描画
  const processFrameVirtual = async () => {
    if (!videoVbg || !ctxVbg.value) return

    console.log('----- processFrameVirtual() -----')

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

  // mediaStream 削除
  const closeMediaStream = async () => {
    webcamRunning.value = false

    // requestAnimationFrame() 停止
    window.cancelAnimationFrame(requestIdVb)

    // mediaStream 停止
    mediaStreamVbg.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamVbg.value?.removeTrack(tr)
    })
  }

  // mediaStream 取得
  const getMediaStream = () => {
    return mediaStreamVbg.value
  }

  return {
    // properties
    bgImageUrl,
    // methods
    loadBackgroundImage,
    openMediaStream,
    getMediaStream,
    closeMediaStream
  }
})
