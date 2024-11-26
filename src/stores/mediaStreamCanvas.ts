import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStreamCanvasStore = defineStore('media-stream-canvas', () => {
  // Audio
  const mediaStreamAudio = ref<MediaStream>()

  // canvas Media Stream
  const mediaStream = ref<MediaStream>(new MediaStream())

  // MediaStream 代替テキスト用
  const altText = ref('')
  const canvas = ref()
  const ctx = ref()
  const ctxOption = {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  }

  let requestId = 0

  //
  async function openMediaStream(mediaStreamConstraints: MediaStreamConstraints) {
    try {
      mediaStreamAudio.value = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
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

    canvas.value = document.createElement('canvas')
    canvas.value.width = ctxOption.width
    canvas.value.height = ctxOption.height
    ctx.value = canvas.value.getContext('2d')
    mediaStream.value = canvas.value.captureStream()

    // 音声トラック追加
    mediaStream.value.getAudioTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
    mediaStreamAudio.value?.getAudioTracks().forEach((tr) => {
      mediaStream.value.addTrack(tr.clone())
    })

    // テキストCanvas描画
    loopAnime()
  }

  function loopAnime() {
    ctx.value.clearRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctx.value.fillStyle = 'black'
    ctx.value.fillRect(ctxOption.x, ctxOption.y, ctxOption.width, ctxOption.height)
    ctx.value.font = '100px sans-serif'
    ctx.value.fillStyle = 'white'
    ctx.value.textAlign = 'center'
    ctx.value.textBaseline = 'bottom'
    ctx.value.fillText(altText.value, ctxOption.width / 2, ctxOption.height / 2)
    requestId = window.requestAnimationFrame(loopAnime)
  }

  //
  function closeMediaStream() {
    // stop the Canvas Animation
    window.cancelAnimationFrame(requestId)

    // stop & remove mediastreamtracks
    mediaStream.value.getTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
    mediaStreamAudio.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamAudio.value?.removeTrack(tr)
    })
  }

  return {
    altText,
    mediaStream,
    openMediaStream,
    closeMediaStream
  }
})
