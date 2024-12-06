import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMediaDeviceStore = defineStore('media-device', () => {
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
  // console.info('supportedConstraints', supportedConstraints)

  // devices
  const deviceVideoInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioInputs = ref<MediaDeviceInfo[]>([])
  const deviceAudioOutputs = ref<MediaDeviceInfo[]>([])
  // device selected
  const videoInputDeviceId = ref('')
  const audioInputDeviceId = ref('')
  const audioOutputDeviceId = ref('')

  async function init() {
    await makeDeviceList()
    // 制約に deviceId を設定
    mediaStreamConstraints.value.video.deviceId = videoInputDeviceId.value
    mediaStreamConstraints.value.audio.deviceId = audioInputDeviceId.value
  }

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

  return {
    deviceVideoInputs,
    deviceAudioInputs,
    deviceAudioOutputs,
    videoInputDeviceId,
    audioInputDeviceId,
    audioOutputDeviceId,
    mediaStreamConstraints,
    init,
    makeDeviceList
  }
})
