import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStore = defineStore('media', () => {
  // local Media Stream
  const mediaStreamLocal = ref<MediaStream>(new MediaStream())
  // media stream
  const mediaStream = ref<MediaStream>(new MediaStream())

  // mediaStream constraints
  const mediaStreamConstraints = ref<any>({
    video: {
      deviceId: '',
      width: 1920,
      height: 1080,
      aspectRatio: 1.777777778,
      frameRate: { max: 30 },
      facingMode: 'user'
    },
    audio: {
      deviceId: ''
    }
  })

  // // constraints
  // const supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
  // console.log('supportedConstraints', supportedConstraints)

  // devices
  const deviceVideoInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioOutputs = ref<MediaDeviceInfo[]>([])
  // device selected
  const videoInputDeviceId = ref('')
  const audioInputDeviceId = ref('')
  const audioOutputDeviceId = ref('')

  // device list 作成
  async function makeDeviceList() {
    // init. select each 1st device.
    const devices = await navigator.mediaDevices.enumerateDevices()
    deviceAudioInputs.value = devices.filter((item) => {
      return item.kind === 'audioinput'
    })
    deviceAudioOutputs.value = devices.filter((item) => {
      return item.kind === 'audiooutput'
    })
    deviceVideoInputs.value = devices.filter((item) => {
      return item.kind === 'videoinput'
    })
    if (videoInputDeviceId.value === '' && deviceVideoInputs.value.length > 0) {
      videoInputDeviceId.value = deviceVideoInputs.value[0].deviceId
    }
    if (audioInputDeviceId.value === '' && deviceAudioInputs.value.length > 0) {
      audioInputDeviceId.value = deviceAudioInputs.value[0].deviceId
    }
    if (audioOutputDeviceId.value === '' && deviceAudioOutputs.value.length > 0) {
      audioOutputDeviceId.value = deviceAudioOutputs.value[0].deviceId
    }
  }
  makeDeviceList()
  // 制約に deviceId を設定
  mediaStreamConstraints.value.video.deviceId = videoInputDeviceId.value
  mediaStreamConstraints.value.audio.deviceId = audioInputDeviceId.value

  // device 切替 - Video Input
  async function changeVideoInput() {
    console.log('--- changeVideoInput() ---')
    closeMediaStreamLocal()
    mediaStreamConstraints.value.video.deviceId = videoInputDeviceId.value
    await openMediaStreamLocal()
    mediaStream.value = mediaStreamLocal.value
  }
  // device 切替 - Audio Input
  async function changeAudioInput() {
    console.log('--- changeAudioInput() ---')
    closeMediaStreamLocal()
    mediaStreamConstraints.value.audio.deviceId = audioInputDeviceId.value
    await openMediaStreamLocal()
    mediaStream.value = mediaStreamLocal.value
  }

  // open a media-stream
  async function openMediaStreamLocal() {
    // local stream 取得
    try {
      mediaStreamLocal.value = await navigator.mediaDevices.getUserMedia(
        mediaStreamConstraints.value
      )
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

  // 映像入力 on/off
  function setVideoEnabled(value: boolean) {
    mediaStream.value.getVideoTracks().forEach((track) => {
      track.enabled = value
    })
  }

  // 音声入力 on/off
  function setAudioEnabled(value: boolean) {
    mediaStream.value.getAudioTracks().forEach((track) => {
      track.enabled = value
    })
  }

  // close the media-stream
  function closeMediaStreamLocal() {
    mediaStreamLocal.value.getTracks().forEach((tr) => {
      tr.stop()
      mediaStreamLocal.value.removeTrack(tr)
    })
  }

  // close the media-stream
  function closeMediaStream() {
    mediaStream.value.getTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
  }

  return {
    deviceVideoInputs,
    deviceAudioInputs,
    deviceAudioOutputs,
    videoInputDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    makeDeviceList,
    changeVideoInput,
    changeAudioInput,

    mediaStreamConstraints,
    mediaStream,
    mediaStreamLocal,
    openMediaStreamLocal,
    setVideoEnabled,
    setAudioEnabled,
    closeMediaStreamLocal,
    closeMediaStream
  }
})
