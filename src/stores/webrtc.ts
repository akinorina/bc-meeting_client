import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Peer } from 'peerjs'
import type { MediaConnection, PeerOptions } from 'peerjs'

export class PeerMedia {
  peerId: string = ''
  mediaConn: any = undefined
  mediaStream: any = undefined
}

interface PeerMediaObject {
  [key: string]: PeerMedia
}

export const useWebrtcStore = defineStore('webrtc', () => {
  // my peer name.
  const myName = ref<string>('')

  // peer
  const peer = ref<Peer>()

  // my Peer ID.
  const peerIdOnStorage = localStorage.getItem('peer_id')
  const myPeerId = ref<string>(peerIdOnStorage ? peerIdOnStorage : '')

  // my Media Stream
  const myMediaStream = ref<MediaStream | null>(null)

  // (remote) PeerMedia
  const peerMedias = ref<PeerMediaObject>({})

  // // 送受信メッセージデータ
  // const messageData = ref<any[]>([])

  // // data connection
  // const dataConn = ref<DataConnection>()

  // UserMedia
  const getUserMedia = navigator.mediaDevices.getUserMedia

  // open my MediaStream
  async function openMyMediaStream(trackStatus: object = { video: true, audio: true }) {
    // local stream 取得
    try {
      myMediaStream.value = await getUserMedia(trackStatus)
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

  function setVideoEnabled(value: boolean) {
    myMediaStream.value?.getVideoTracks().forEach((track) => {
      track.enabled = value
    })
  }
  function setAudioEnabled(value: boolean) {
    myMediaStream.value?.getAudioTracks().forEach((track) => {
      track.enabled = value
    })
  }

  // close my MediaStream
  function closeMyMediaStream() {
    myMediaStream.value?.getTracks().forEach(async (track) => await track.stop())
    myMediaStream.value = null
  }

  async function open(options: PeerOptions) {
    // Peerサーバー接続
    peer.value = new Peer(myPeerId.value, {
      host: options.host,
      port: options.port,
      path: options.path,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.l.google.com:5349' },
          { urls: 'stun:stun1.l.google.com:3478' },
          { urls: 'stun:stun1.l.google.com:5349' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:5349' },
          { urls: 'stun:stun3.l.google.com:3478' },
          { urls: 'stun:stun3.l.google.com:5349' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:5349' }
        ],
        sdpSemantics: 'unified-plan'
      }
    })

    // on: Peerサーバー接続確立
    peer.value.on('open', () => {
      myPeerId.value = peer.value ? peer.value.id : ''
      localStorage.setItem('peer_id', myPeerId.value)
    })

    // on: Peer接続が切断された
    peer.value.on('disconnected', () => {
      myPeerId.value = ''
      localStorage.setItem('peer_id', '')
    })

    // on: Peer接続が破壊され、再接続できない
    peer.value.on('close', () => {
      myPeerId.value = ''
      localStorage.setItem('peer_id', '')
    })

    // // on: Peer Data接続 確立
    // peer.value.on('connection', (conn: DataConnection) => {
    //   dataConn.value = conn

    //   // // on data: Data接続確立
    //   // dataConn.value.on('open', () => {
    //   //   // 接続されたことの告知 送信
    //   //   const sendData = { who: '-', message: '接続しました。' }
    //   //   dataConn.value?.send(sendData)
    //   // })

    //   // // on data: Data受信
    //   // dataConn.value.on('data', (data: any) => {
    //   //   // 受信データの表示
    //   //   messageData.value.push(data)
    //   // })

    //   // // on data: Data接続を切断された
    //   // dataConn.value.on('close', () => {
    //   //   // Data接続 切断 & clean up.
    //   //   dataConn.value?.close()
    //   // })

    //   // // on data: error
    //   // dataConn.value.on('error', (error) => {
    //   //   throw error
    //   // })
    // })
    /* */

    // on: Peer Media接続 呼び出しあり
    peer.value.on('call', (call: MediaConnection) => {
      if (myMediaStream.value === null || !call) {
        return false
      }

      const remotePeerId: string = call.peer

      peerMedias.value[remotePeerId] = new PeerMedia()
      peerMedias.value[remotePeerId].peerId = remotePeerId

      // media接続を確保
      peerMedias.value[remotePeerId].mediaConn = call

      // Peer Media接続へ応答
      peerMedias.value[remotePeerId].mediaConn?.answer(myMediaStream.value)

      // on media: Remote Peer のストリーム取得時
      peerMedias.value[remotePeerId].mediaConn?.on('stream', (remoteStream: any) => {
        peerMedias.value[remotePeerId].mediaStream = remoteStream
      })

      // on media: Media接続 切断
      peerMedias.value[remotePeerId].mediaConn?.on('close', async () => {
        // closeした MediaStream停止
        await peerMedias.value[remotePeerId].mediaStream
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // closeした MediaConnection CLOSE
        await peerMedias.value[remotePeerId].mediaConn.close()

        // closeした peerMedia 削除
        delete peerMedias.value[remotePeerId]
      })

      // on media: error
      peerMedias.value[remotePeerId].mediaConn?.on('error', (error: any) => {
        throw error
      })
    })

    // on: error
    peer.value.on('error', (error: any) => {
      throw error
    })
  }

  // Media Coonection 発信
  async function connectMedia(remotePeerId: string) {
    if (!peer.value || !myMediaStream.value) {
      return false
    }

    peerMedias.value[remotePeerId] = new PeerMedia()
    peerMedias.value[remotePeerId].peerId = remotePeerId

    // call
    const mc = peer.value.call(remotePeerId, myMediaStream.value)
    peerMedias.value[remotePeerId].mediaConn = mc

    peerMedias.value[remotePeerId].mediaConn?.on('stream', function (remoteStream: any) {
      peerMedias.value[remotePeerId].mediaStream = remoteStream
    })

    peerMedias.value[remotePeerId].mediaConn?.on('close', async () => {
      // closeした MediaStream停止
      await peerMedias.value[remotePeerId].mediaStream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop())

      // closeした MediaConnection CLOSE
      await peerMedias.value[remotePeerId].mediaConn?.close()

      // closeした peerMedia 削除
      delete peerMedias.value[remotePeerId]
    })

    return true
  }

  function disconnectMedia() {
    // PeerMediaすべてを停止、Close、削除
    Object.keys(peerMedias.value).forEach(async (key) => {
      // MediaStream停止
      await peerMedias.value[key].mediaStream
        ?.getTracks()
        .forEach((track: MediaStreamTrack) => track.stop())

      // MediaConnection CLOSE
      await peerMedias.value[key].mediaConn?.close()

      // peerMedia 削除
      delete peerMedias.value[key]
    })
  }

  // // Data Connection 発信
  // function connectData(remoteId) {
  //   dataConn.value = peer.value.connect(remoteId)

  //   dataConn.value.on('open', () => {
  //     const sendData = { who: '-', message: '接続しました。' }
  //     dataConn.value.send(sendData)
  //     messageData.value.push(sendData)
  //   })

  //   dataConn.value.on('data', (data) => {
  //     messageData.value.push(data)
  //   })

  //   dataConn.value.on('close', () => {
  //     dataConn.value.close()
  //   })
  // }

  // // Data Connection メッセージの送信
  // function sendData(sendText) {
  //   const sendData = { who: myName.value, message: sendText }
  //   dataConn.value.send(sendData)
  //   messageData.value.push(sendData)
  // }

  // function disconnectData() {
  //   dataConn.value.close()
  // }

  async function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()

    // myMediaStream stops.
    closeMyMediaStream()

    // Peer切断
    peer.value?.disconnect()
    myPeerId.value = ''
    localStorage.setItem('peer_id', '')
  }

  // 相手側から disconnect() されたときの Media close 不良への対応
  function checkMedias(currentPeerIds: Array<string>) {
    Object.keys(peerMedias.value).forEach(async (peerId: string) => {
      if (!currentPeerIds.includes(peerMedias.value[peerId].peerId)) {
        // MediaStream停止
        await peerMedias.value[peerId].mediaStream
          ?.getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // MediaConnection CLOSE
        await peerMedias.value[peerId].mediaConn?.close()

        // peerMedia 削除
        delete peerMedias.value[peerId]
      }
    })
  }

  return {
    myName,
    myPeerId,
    myMediaStream,
    peerMedias,
    // messageData,

    open,
    close,
    setVideoEnabled,
    setAudioEnabled,
    openMyMediaStream,
    closeMyMediaStream,
    connectMedia,
    disconnectMedia,
    checkMedias
    // connectData,
    // sendData,
    // disconnectData,
  }
})
