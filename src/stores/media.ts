import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaStore = defineStore('media', () => {
  // local Media Stream
  const mediaStreamLocal = ref<MediaStream | null>(null)
  // media stream
  const mediaStream = ref<MediaStream | null>(null)

  // constraints
  const supportedConstraints = navigator.mediaDevices.getSupportedConstraints()
  console.log('supportedConstraints', supportedConstraints)

  // mediaStream constraints
  const mediaStreamConstraints = ref<any>({ video: true, audio: true })

  // devices
  const deviceVideoInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioOutputs = ref<MediaDeviceInfo[]>([])
  // device selected
  const videoInputDeviceId = ref('default')
  const audioInputDeviceId = ref('default')
  const audioOutputDeviceId = ref('default')

  // audio
  const audioContext = ref()
  const mediaStreamSource = ref()
  const audioDestination = ref()
  const gainNode = ref()
  const volume = ref(100)
  const isReady = ref(false)

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
  }
  // device 選択値 初期値設定
  makeDeviceList().then(() => {
    audioInputDeviceId.value = deviceAudioInputs.value[0].deviceId
    audioOutputDeviceId.value = deviceAudioOutputs.value[0].deviceId
    videoInputDeviceId.value = deviceVideoInputs.value[0].deviceId
  })

  // device 切替 - Video Input
  async function changeVideoInput() {
    closeMediaStream()
    mediaStreamConstraints.value.video = { deviceId: videoInputDeviceId.value }
    openMediaStream()
  }
  // device 切替 - Audio Input
  async function changeAudioInput() {
    closeMediaStream()
    mediaStreamConstraints.value.audio = { deviceId: audioInputDeviceId.value }
    openMediaStream()
  }
  // device 切替 - Audio Output
  async function changeAudioOutput() {
    console.log('--- changeAudioOutput() ---')
  }

  // open a media-stream
  async function openMediaStream() {
    // local stream 取得
    try {
      mediaStreamLocal.value = await navigator.mediaDevices.getUserMedia(
        mediaStreamConstraints.value
      )
      mediaStream.value = mediaStreamLocal.value.clone()

      audioContext.value = new window.AudioContext()
      mediaStreamSource.value = await audioContext.value.createMediaStreamSource(mediaStream.value)
      audioDestination.value = await audioContext.value.createMediaStreamDestination()
      gainNode.value = await audioContext.value.createGain()

      await mediaStreamSource.value.connect(gainNode.value)
      await gainNode.value.connect(audioDestination.value)
      await gainNode.value.gain.setValueAtTime(volume.value / 100, audioContext.value.currentTime)

      isReady.value = true
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
    mediaStream.value?.getVideoTracks().forEach((track) => {
      track.enabled = value
    })
  }

  // 音声入力 on/off
  function setAudioEnabled(value: boolean) {
    mediaStream.value?.getAudioTracks().forEach((track) => {
      track.enabled = value
    })
  }

  // close the media-stream
  function closeMediaStream() {
    mediaStream.value?.getTracks().forEach(async (track) => await track.stop())
    mediaStream.value = null
    mediaStreamLocal.value?.getTracks().forEach(async (track) => await track.stop())
    mediaStreamLocal.value = null
  }

  // MediaStream(video)を差し替える
  function setMediaStream(iMediaStream: MediaStream) {
    // video tracks を削除
    const videotracks = mediaStream.value?.getVideoTracks()
    videotracks?.forEach((tr) => {
      mediaStream.value?.removeTrack(tr)
    })
    // video tracks を追加
    const vtracks = iMediaStream.getVideoTracks()
    vtracks.forEach((tr) => {
      mediaStream.value?.addTrack(tr)
    })
  }

  // MediaStream(video)を元の mediaStreamLocal に戻す
  function setLocalMediaStream() {
    // video tracks を削除
    const videotracks = mediaStream.value?.getVideoTracks()
    videotracks?.forEach((tr) => {
      mediaStream.value?.removeTrack(tr)
    })
    // video tracks を追加
    const vtracks = mediaStreamLocal.value?.getVideoTracks()
    if (vtracks) {
      vtracks.forEach((tr) => {
        mediaStream.value?.addTrack(tr)
      })
    }
  }

  // change volume
  function changeVolume() {
    gainNode.value.gain.setValueAtTime(volume.value / 100, audioContext.value.currentTime)
  }

  return {
    deviceAudioInputs,
    deviceAudioOutputs,
    deviceVideoInputs,
    audioInputDeviceId,
    audioOutputDeviceId,
    videoInputDeviceId,

    makeDeviceList,
    changeVideoInput,
    changeAudioInput,
    changeAudioOutput,

    mediaStreamConstraints,
    mediaStream,
    mediaStreamLocal,
    setVideoEnabled,
    setAudioEnabled,

    audioContext,
    mediaStreamSource,
    audioDestination,
    gainNode,
    volume,
    isReady,
    changeVolume,

    openMediaStream,
    closeMediaStream,
    setMediaStream,
    setLocalMediaStream
  }
})
