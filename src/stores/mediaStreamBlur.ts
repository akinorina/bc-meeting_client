/*
 * バーチャル背景（ぼかし）処理 構造
 *
 *  getUserMedia() ← WebCamera & Mic
 *  ↓
 *  videoVbg
 *  ↓                   ↓
 *  ctxVbg(canvasVbg)   ctxBlur(CanvasBlur)
 *  ↓                   ↓
 *  imageData         ← imageBlur
 *  ↓
 *  ctxVbg(canvasVbg)
 *  ↓
 *  mediaStreamVbg (output)
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from '@mediapipe/tasks-vision'

export const useMediaStreamBlurStore = defineStore('media-stream-blur', () => {
  // 出力 media stream
  const mediaStreamNormal = ref<MediaStream>()
  // 出力 media stream
  const mediaStreamVbg = ref<MediaStream>()

  // Camera動画用 Video
  let videoVbg: HTMLVideoElement

  // 出力する動画用 Canvas
  const canvasVbg = ref<HTMLCanvasElement>()
  const ctxVbg = ref<CanvasRenderingContext2D>()
  const ctxOption = {
    x: 0,
    y: 0,
    width: 640, // 1280, // 1920,
    height: 360 // 720 // 1080
  }

  // バックグラウンド分割`処理用
  let requestIdVb = 0
  let imageSegmenter: ImageSegmenter

  // 背景ぼかし効果値
  const backgroundBlur = ref(10)
  const canvasBlur = ref<HTMLCanvasElement>()
  const ctxBlur = ref<CanvasRenderingContext2D>()

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
    // ぼかし用Canvas - Blur
    canvasBlur.value = document.createElement('canvas') as HTMLCanvasElement
    canvasBlur.value.width = ctxOption.width
    canvasBlur.value.height = ctxOption.height
    ctxBlur.value = canvasBlur.value.getContext('2d') as CanvasRenderingContext2D
    ctxBlur.value.filter = 'blur(' + backgroundBlur.value + 'px)'

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

  // 初期化 => 実行
  async function initBodySegmentation() {
    // フレーム処理の開始
    webcamRunning.value = true

    // ボディセグメンテーションモデルの作成
    await createBodySegmentation()

    // ぼかし動画 描画実行
    processFrameBlur()
  }

  // 画像セグメンテーション
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

  // ぼかし描画
  const processFrameBlur = async () => {
    if (!videoVbg || !ctxVbg.value || !ctxBlur.value) return

    if (videoVbg.currentTime === lastWebcamTime) {
      if (webcamRunning.value) {
        requestIdVb = window.requestAnimationFrame(processFrameBlur)
      }
      return
    }
    lastWebcamTime = videoVbg.currentTime

    // Video映像 => 出力用 Canvas 描画
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

  // mediaStream 削除
  const closeMediaStream = async (kind: '' | 'video' | 'audio' = '') => {
    webcamRunning.value = false

    // requestAnimationFrame() 停止
    window.cancelAnimationFrame(requestIdVb)

    let tracks: MediaStreamTrack[] = []
    switch (kind) {
      case 'video':
        tracks = mediaStreamVbg.value?.getVideoTracks() as MediaStreamTrack[]
        break
      case 'audio':
        tracks = mediaStreamVbg.value?.getAudioTracks() as MediaStreamTrack[]
        break
      default:
        tracks = mediaStreamVbg.value?.getTracks() as MediaStreamTrack[]
        break
    }
    tracks.forEach((tr) => {
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
    backgroundBlur,
    // methods
    openMediaStream,
    getMediaStream,
    closeMediaStream
  }
})
