/**
 * MediaStreamStore
 */
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useMediaDeviceStore } from './mediaDevice'
import { useMediaStreamNormalStore } from './mediaStreamNormal'
import { useMediaStreamAlttextStore } from './mediaStreamAlttext'
import { useMediaStreamBlurStore } from './mediaStreamBlur'
import { useMediaStreamVbgStore } from './mediaStreamVbg'
import type { BackgroundSettingObject } from '@/lib'
import backgroundData from '@/assets/background.json'

export const useMediaStreamStore = defineStore('media-stream', () => {
  // media stream
  const mediaStream = ref<MediaStream>(new MediaStream())
  const mediaStreamNormal = ref<MediaStream>(new MediaStream())
  const mediaStreamAlttext = ref<MediaStream>(new MediaStream())
  const mediaStreamBlur = ref<MediaStream>(new MediaStream())
  const mediaStreamVbg = ref<MediaStream>(new MediaStream())

  const mediaDeviceStore = useMediaDeviceStore()
  const mediaStreamNormalStore = useMediaStreamNormalStore()
  const mediaStreamAlttextStore = useMediaStreamAlttextStore()
  const mediaStreamBlurStore = useMediaStreamBlurStore()
  const mediaStreamVbgStore = useMediaStreamVbgStore()

  // video mode
  const videoMode = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
  const videoModeTmp = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
  const videoModeBefore = ref<'normal' | 'alt-text' | 'blur' | 'image'>('normal')
  const videoModeData = ref<BackgroundSettingObject>(backgroundData as BackgroundSettingObject)

  // altText
  const altText = ref('')
  watch(altText, () => {
    mediaStreamAlttextStore.altText = altText.value
  })

  // video/audio: on/off
  const trackStatus = ref({ video: true, audio: true })

  // 鏡映反転 flag
  const myVideoMirrored = ref(true)

  /**
   * 初期設定
   */
  async function init() {
    // normalモード
    videoMode.value = 'normal'

    // MediaDevice
    await mediaDeviceStore.init()

    // MediaStream normal 作成
    await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
    mediaStream.value = mediaStreamNormalStore.cloneMediaStream()
    mediaStreamNormalStore.closeMediaStream()
  }

  /**
   * add a video track
   */
  async function _addVideoTrack(targetVideoMode: 'normal' | 'alt-text' | 'blur' | 'image') {
    switch (videoModeData.value[targetVideoMode].type) {
      case 'normal':
        await mediaStreamNormalStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
        mediaStreamNormal.value = mediaStreamNormalStore.getMediaStream() as MediaStream
        //
        mediaStreamNormal.value.getAudioTracks().forEach((tr) => {
          tr.stop()
          mediaStreamNormal.value?.removeTrack(tr)
        })
        //
        mediaStreamNormal.value.getVideoTracks().forEach((tr) => {
          mediaStream.value.addTrack(tr)
        })
        break
      case 'alt-text':
        // Video トラック AltText設定
        mediaStreamAlttextStore.altText = altText.value
        mediaStreamAlttextStore.openMediaStream()
        mediaStreamAlttext.value = mediaStreamAlttextStore.getMediaStream()
        // audio track 削除
        mediaStreamAlttext.value.getAudioTracks().forEach((tr) => {
          tr.stop()
          mediaStreamAlttext.value?.removeTrack(tr)
        })
        // video track を mediaStream へ追加
        mediaStreamAlttext.value.getVideoTracks().forEach((tr) => {
          mediaStream.value.addTrack(tr)
        })
        break
      case 'blur':
        // video トラック Blur設定
        await mediaStreamBlurStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
        mediaStreamBlur.value = mediaStreamBlurStore.getMediaStream() as MediaStream
        //
        mediaStreamBlur.value.getAudioTracks().forEach((tr) => {
          tr.stop()
          mediaStreamBlur.value.removeTrack(tr)
        })
        //
        mediaStreamBlur.value.getVideoTracks().forEach((tr) => {
          mediaStream.value.addTrack(tr)
        })
        break
      case 'image':
        await mediaStreamVbgStore.openMediaStream(mediaDeviceStore.mediaStreamConstraints)
        mediaStreamVbg.value = mediaStreamVbgStore.getMediaStream() as MediaStream
        //
        mediaStreamVbg.value.getAudioTracks().forEach((tr) => {
          tr.stop()
          mediaStreamVbg.value.removeTrack(tr)
        })
        //
        mediaStreamVbg.value.getVideoTracks().forEach((tr) => {
          mediaStream.value.addTrack(tr)
        })
        break
    }
  }

  /**
   * remove a video track
   */
  async function _removeVideoTrack(targetVideoMode: 'normal' | 'alt-text' | 'blur' | 'image') {
    switch (videoModeData.value[targetVideoMode].type) {
      case 'normal':
        await mediaStreamNormalStore.closeMediaStream()
        break
      case 'alt-text':
        await mediaStreamAlttextStore.closeMediaStream()
        break
      case 'blur':
        await mediaStreamBlurStore.closeMediaStream()
        break
      case 'image':
        await mediaStreamVbgStore.closeMediaStream()
        break
    }
    mediaStream.value.getVideoTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
  }

  /**
   * add a audio track
   */
  async function _addAudioTrack() {
    //
    await mediaStreamNormalStore.openMediaStream(
      mediaDeviceStore.mediaStreamConstraints,
      'only-audio'
    )
    mediaStreamNormal.value = mediaStreamNormalStore.getMediaStream() as MediaStream
    mediaStreamNormal.value.getAudioTracks().forEach((tr) => {
      mediaStream.value.addTrack(tr.clone())
    })
    mediaStreamNormalStore.closeMediaStream()
  }

  /**
   * remove a audio track
   */
  async function _removeAudioTrack() {
    //
    mediaStream.value.getAudioTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value.removeTrack(tr)
    })
  }

  /**
   * Video トラック on/off
   */
  async function toggleVideo() {
    // video 状態切り替え
    trackStatus.value.video = !trackStatus.value.video

    // 原稿モードの Video Track を削除
    await _removeVideoTrack(videoMode.value)

    // モード切り替え
    if (trackStatus.value.video) {
      // on
      videoMode.value = videoModeTmp.value
      videoModeBefore.value = videoMode.value
    } else {
      // off
      videoModeTmp.value = videoMode.value
      videoMode.value = 'alt-text'
      videoModeBefore.value = videoMode.value
    }

    // 原稿モードの Video Track を設定
    await _addVideoTrack(videoMode.value)
  }

  /**
   * Video トラック on/off
   */
  async function toggleAudio() {
    // audio 状態切り替え
    trackStatus.value.audio = !trackStatus.value.audio

    // mute on/off切り替え
    mediaStream.value?.getAudioTracks().forEach((tr) => {
      tr.enabled = trackStatus.value.audio
    })
  }

  /**
   * videoMode 変更
   */
  async function changeBackground() {
    //
    await _removeVideoTrack(videoModeBefore.value)
    //
    await _addVideoTrack(videoMode.value)

    switch (videoModeData.value[videoMode.value].type) {
      case 'normal':
        trackStatus.value.video = true
        videoModeBefore.value = videoMode.value
        break
      case 'alt-text':
        trackStatus.value.video = false
        videoModeTmp.value = videoModeBefore.value
        videoModeBefore.value = videoMode.value
        break
      case 'blur':
        trackStatus.value.video = true
        videoModeBefore.value = videoMode.value
        break
      case 'image':
        trackStatus.value.video = true
        videoModeBefore.value = videoMode.value
        break
    }
  }

  /**
   * video device 切り替え
   */
  async function changeVideoInput() {
    // device 切替 - Video Input
    mediaDeviceStore.mediaStreamConstraints.video.deviceId = mediaDeviceStore.videoInputDeviceId
    // mediastream 再起動
    await _removeVideoTrack(videoMode.value)
    await _addVideoTrack(videoMode.value)
  }

  /**
   * audio device 切り替え
   */
  async function changeAudioInput() {
    // device 切替 - Audio Input
    mediaDeviceStore.mediaStreamConstraints.audio.deviceId = mediaDeviceStore.audioInputDeviceId
    // mediastream 再起動
    await _removeAudioTrack()
    await _addAudioTrack()
  }

  /**
   * destroy
   */
  function destroy() {
    mediaStream.value?.getTracks().forEach((tr) => {
      tr.stop()
      mediaStream.value?.removeTrack(tr)
    })
  }

  return {
    // properties
    mediaDeviceStore,
    mediaStream,
    trackStatus,
    videoMode,
    myVideoMirrored,
    altText,
    videoModeData,
    // methods
    init,
    toggleVideo,
    toggleAudio,
    changeBackground,
    changeVideoInput,
    changeAudioInput,
    destroy
  }
})
