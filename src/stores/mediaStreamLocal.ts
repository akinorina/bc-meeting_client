import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStreamLocalStore = defineStore('media-stream-local', () => {
  // local Media Stream
  const mediaStream = ref<MediaStream>(new MediaStream())

  // open a media-stream
  async function openMediaStream(mediaStreamConstraints: MediaStreamConstraints) {
    // local stream 取得
    try {
      mediaStream.value = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
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

  // close the media-stream
  function closeMediaStream() {
    mediaStream.value.getTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
  }

  return {
    mediaStream,
    openMediaStream,
    closeMediaStream
  }
})
