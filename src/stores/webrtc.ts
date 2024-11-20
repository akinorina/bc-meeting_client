import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Peer } from 'peerjs'
import type { MediaConnection, PeerOptions } from 'peerjs'

export class PeerMedia {
  peerId: string = ''
  mediaConn: any = undefined
  mediaStream: any = undefined
  displayName: string = ''
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
  const peerMediasNum = ref(Object.keys(peerMedias.value).length)

  // // 送受信メッセージデータ
  // const messageData = ref<any[]>([])

  // // data connection
  // const dataConn = ref<DataConnection>()

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
      console.log('--- peer on(open) ---')
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

        peerMediasNum.value = Object.keys(peerMedias.value).length
      })

      // on media: error
      peerMedias.value[remotePeerId].mediaConn?.on('error', (err: any) => {
        console.error('mediaconn error name', err.name)
        console.error('mediaconn error type', err.type)
        console.error('mediaconn error message', err.message)
      })

      peerMediasNum.value = Object.keys(peerMedias.value).length
    })

    // on: error
    peer.value.on('error', (err) => {
      console.error('peer error', err.type)
      console.error('peer error', err)
      console.log('peer id', peer.value?.id)
      console.log('connections', peer.value?.connections)
      console.log('disconnect', peer.value?.disconnected)
      console.log('destroyed', peer.value?.destroyed)
    })
  }

  // Media 接続
  async function connectMedia(remotePeerId: string, displayName: string) {
    if (!peer.value || !myMediaStream.value) {
      return false
    }

    if (remotePeerId === myPeerId.value) {
      // 自分のPeerId
      peerMedias.value[remotePeerId] = new PeerMedia()
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].displayName = displayName
      peerMedias.value[remotePeerId].mediaConn = null
      peerMedias.value[remotePeerId].mediaStream = myMediaStream.value

      peerMediasNum.value = Object.keys(peerMedias.value).length
    } else {
      // 他のPeerId
      peerMedias.value[remotePeerId] = new PeerMedia()
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].displayName = displayName

      // call
      const mc = peer.value.call(remotePeerId, myMediaStream.value)
      peerMedias.value[remotePeerId].mediaConn = mc

      peerMedias.value[remotePeerId].mediaConn?.on('stream', function (remoteStream: any) {
        peerMedias.value[remotePeerId].mediaStream = remoteStream

        peerMediasNum.value = Object.keys(peerMedias.value).length
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

        peerMediasNum.value = Object.keys(peerMedias.value).length
      })
    }

    return true
  }

  // Media 切断
  function disconnectMedia() {
    // PeerMediaすべてを停止、Close、削除
    Object.keys(peerMedias.value).forEach(async (peerId) => {
      if (peerId !== myPeerId.value) {
        // MediaStream停止
        await peerMedias.value[peerId].mediaStream
          ?.getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // MediaConnection CLOSE
        await peerMedias.value[peerId].mediaConn?.close()
      }

      // peerMedia 削除
      delete peerMedias.value[peerId]

      peerMediasNum.value = Object.keys(peerMedias.value).length
    })
  }

  // // Data 接続
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

  // // Data メッセージの送信
  // function sendData(sendText) {
  //   const sendData = { who: myName.value, message: sendText }
  //   dataConn.value.send(sendData)
  //   messageData.value.push(sendData)
  // }

  // // Data 切断
  // function disconnectData() {
  //   dataConn.value.close()
  // }

  async function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()

    // Peer切断
    peer.value?.disconnect()
    myPeerId.value = ''
    localStorage.setItem('peer_id', '')
  }

  function checkMedias(statusRoomRes: any) {
    // 表示名の補完
    statusRoomRes.attenders.forEach((item: any) => {
      Object.keys(peerMedias.value).forEach((peerId) => {
        if (peerId === item.peer_id) {
          peerMedias.value[peerId].displayName = item.display_name
        }
      })
    })

    // 相手側から disconnect() されたときの Media close 不良への対応
    const currentPeerIds: Array<string> = statusRoomRes.attenders.map((item: any) => {
      return item.peer_id
    })
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

        peerMediasNum.value = Object.keys(peerMedias.value).length
      }
    })
  }

  return {
    myName,
    myPeerId,
    myMediaStream,
    peerMedias,
    peerMediasNum,
    // messageData,

    open,
    close,
    connectMedia,
    disconnectMedia,
    checkMedias
    // connectData,
    // sendData,
    // disconnectData,
  }
})
