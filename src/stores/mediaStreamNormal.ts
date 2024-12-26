import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStreamNormalStore = defineStore('media-stream-normal', () => {
  // media stream
  const mediaStreamNormal = ref<MediaStream>()

  // mediaStream 作成
  async function openMediaStream(mediaStreamConstraints: MediaStreamConstraints) {
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

  // mediaStream 取得
  function getMediaStream() {
    return mediaStreamNormal.value
  }

  // mediaStream 削除
  const closeMediaStream = async (kind: '' | 'video' | 'audio' = '') => {
    let tracks = []
    switch (kind) {
      case 'video':
        tracks = mediaStreamNormal.value?.getVideoTracks() as MediaStreamTrack[]
        break
      case 'audio':
        tracks = mediaStreamNormal.value?.getAudioTracks() as MediaStreamTrack[]
        break
      default:
        tracks = mediaStreamNormal.value?.getTracks() as MediaStreamTrack[]
        break
    }
    tracks.forEach((tr) => {
      tr.stop()
      mediaStreamNormal.value?.removeTrack(tr)
    })
  }

  return {
    openMediaStream,
    getMediaStream,
    closeMediaStream
  }
})
