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
  const myMediaStream = ref<MediaStream>()

  // (remote) PeerMedia
  const peerMedias = ref<PeerMediaObject>({})

  // // 送受信メッセージデータ
  // const messageData = ref<any[]>([])

  // // data connection
  // const dataConn = ref<DataConnection>()

  // UserMedia
  const getUserMedia = navigator.mediaDevices.getUserMedia

  async function open(options: PeerOptions) {
    console.log('--- open() ---')
    // console.log('options', options)
    // console.log('---')
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
    // console.log('peer.value:', peer.value)

    // on: Peerサーバー接続確立
    peer.value.on('open', () => {
      console.log('--- peer.on() - open ---')
      myPeerId.value = peer.value ? peer.value.id : ''
      localStorage.setItem('peer_id', myPeerId.value)
      console.log('myPeerId:', myPeerId.value)
    })

    // on: Peer接続が切断された
    peer.value.on('disconnected', () => {
      myPeerId.value = ''
      localStorage.setItem('peer_id', '')
    })

    // on: Peer接続が破壊され、再接続できない
    peer.value.on('close', () => {
      console.log('>>> >>> peer.on(close) ---')
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
      console.log('call', call)
      if (!myMediaStream.value || !call) {
        return false
      }
      console.log('call.peer', call.peer)
      const remotePeerId: string = call.peer.toString()
      console.log('remotePeerId', remotePeerId)

      peerMedias.value[remotePeerId] = new PeerMedia()

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
        console.log('>>> >>> peerMedia.on(close) ---')

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

    // local stream 取得
    try {
      myMediaStream.value = await getUserMedia({ video: true, audio: false })
      // console.log('my media stream:', myMediaStream.value)
    } catch (err: any) {
      console.error('Failed to get local stream', err)

      // log to console first
      console.log(err) /* handle the error */
      if (err.name == 'NotFoundError' || err.name == 'DevicesNotFoundError') {
        // required track is missing
        console.log('Required track is missing')
      } else if (err.name == 'NotReadableError' || err.name == 'TrackStartError') {
        // webcam or mic are already in use
        console.log('Webcam or mic are already in use')
      } else if (err.name == 'OverconstrainedError' || err.name == 'ConstraintNotSatisfiedError') {
        // constraints can not be satisfied by avb. devices
        console.log('Constraints can not be satisfied by available devices')
      } else if (err.name == 'NotAllowedError' || err.name == 'PermissionDeniedError') {
        // permission denied in browser
        console.log('Permission Denied.')
      } else if (err.name == 'TypeError' || err.name == 'TypeError') {
        // empty constraints object
        console.log('Both audio and video are FALSE')
      } else {
        // other errors
        console.log('Sorry! Another error occurred.')
      }
    }
  }

  // Media Coonection 発信
  function connectMedia(remotePeerId: string) {
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
      console.log('>>> >>> peerMedia2.on(close) --- 2')
      // closeした MediaStream停止
      await peerMedias.value[remotePeerId].mediaStream
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop())

      // closeした MediaConnection CLOSE
      await peerMedias.value[remotePeerId].mediaConn.close()

      // closeした peerMedia 削除
      delete peerMedias.value[remotePeerId]
    })

    return true
  }

  function disconnectMedia() {
    // PeerMediaすべてを停止、Close、削除
    Object.keys(peerMedias.value).forEach(async (key) => {
      await peerMedias.value[key].mediaStream
        ?.getTracks()
        .forEach((track: MediaStreamTrack) => track.stop())

      await peerMedias.value[key].mediaConn?.close()
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

  function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()

    // myMediaStream stops.
    myMediaStream.value?.getTracks().forEach((track) => track.stop())

    // Peer切断
    peer.value?.disconnect()
    myPeerId.value = ''
    localStorage.setItem('peer_id', '')
  }

  return {
    myName,
    myPeerId,
    myMediaStream,
    peerMedias,
    // messageData,

    open,
    close,
    connectMedia,
    disconnectMedia
    // connectData,
    // sendData,
    // disconnectData,
  }
})
