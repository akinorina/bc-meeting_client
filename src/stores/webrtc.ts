import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Peer } from 'peerjs'
import type { MediaConnection, DataConnection, PeerOptions } from 'peerjs'

export class PeerMedia {
  peerId: string = ''
  mediaConn: any = undefined
  mediaStream: any = undefined
}
interface PeerMediaObject {
  [key: string]: PeerMedia
}

export class PeerData {
  peerId: string = ''
  dataConn: any = undefined
  displayName: string = ''
}
interface PeerDataObject {
  [key: string]: PeerData
}

export class DataConnData {
  senderPeerId: string = ''
  type: string = ''
  message: string = ''
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

  // PeerMedia
  const peerMedias = ref<PeerMediaObject>({})
  const peerMediasNum = ref(Object.keys(peerMedias.value).length)

  // PeerData
  const peerData = ref<PeerDataObject>({})

  // 送受信メッセージデータ
  const dataConnData = ref<DataConnData[]>([])

  const errorCallbackFunc = ref<Function>(() => {})

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

    // on: Peer Data接続 確立
    peer.value.on('connection', (conn: DataConnection) => {
      const remotePeerId = conn.peer
      peerData.value[remotePeerId] = new PeerData()
      peerData.value[remotePeerId].peerId = remotePeerId
      peerData.value[remotePeerId].dataConn = conn
      peerData.value[remotePeerId].displayName = myName.value

      // on data: Data接続確立
      peerData.value[remotePeerId].dataConn.on('open', () => {
        // 接続された先へ表示名を送信
        const sendName = new DataConnData()
        sendName.type = 'display_name'
        sendName.senderPeerId = myPeerId.value
        sendName.message = myName.value
        peerData.value[remotePeerId].dataConn.send(sendName)

        // 接続されたことの告知 送信
        const sendData = new DataConnData()
        sendData.type = 'message'
        sendData.senderPeerId = myPeerId.value
        sendData.message = '接続しました。'
        peerData.value[remotePeerId].dataConn.send(sendData)
        dataConnData.value.push(sendData)
      })

      // on data: Data受信
      peerData.value[remotePeerId].dataConn.on('data', (data: DataConnData) => {
        switch (data.type) {
          case 'display_name':
            peerData.value[remotePeerId].displayName = data.message
            break
          case 'message':
            // 受信データの表示
            dataConnData.value.push(data)
            break
        }
      })

      // on data: Data接続を切断された
      peerData.value[remotePeerId].dataConn.on('close', () => {
        // Data接続 切断 & clean up.
        peerData.value[remotePeerId].dataConn.close()
      })

      // on data: error
      peerData.value[remotePeerId].dataConn.on('error', (err: any) => {
        console.error('--- dataConn: on error ---', err)
      })
    })

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
      console.error('peer error', err.message)
      console.error('peer error', err.name)
      console.error('peer error', err.stack)
      console.error('peer error', err)
      console.info('peer id', peer.value?.id)
      console.info('connections', peer.value?.connections)
      console.info('disconnect', peer.value?.disconnected)
      console.info('destroyed', peer.value?.destroyed)

      const options: any = {}
      if (err.type === 'peer-unavailable') {
        console.info('--- peer-unavailable ---')
        const ma = err.message.match(/(\w+-\w+-\w+-\w+-\w+)/)
        if (ma) {
          console.info('error peer id.', ma[1])
          options.peer_id = ma[1]
        }

        errorCallbackFunc.value(options)
      }
    })
  }

  // Media 接続
  async function connectMedia(remotePeerId: string) {
    if (!peer.value || !myMediaStream.value) {
      return false
    }

    if (remotePeerId === myPeerId.value) {
      // 自分のPeerId
      peerMedias.value[remotePeerId] = new PeerMedia()
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].mediaConn = null
      peerMedias.value[remotePeerId].mediaStream = myMediaStream.value

      peerMediasNum.value = Object.keys(peerMedias.value).length
    } else {
      // 他のPeerId
      peerMedias.value[remotePeerId] = new PeerMedia()
      peerMedias.value[remotePeerId].peerId = remotePeerId

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

  // Data 接続
  function connectData(remotePeerId: string, displayName: string) {
    if (remotePeerId === myPeerId.value) {
      // 自分
      peerData.value[remotePeerId] = new PeerData()
      peerData.value[remotePeerId].peerId = remotePeerId
      peerData.value[remotePeerId].dataConn = null
      peerData.value[remotePeerId].displayName = displayName
    } else {
      // 自分以外
      peerData.value[remotePeerId] = new PeerData()
      peerData.value[remotePeerId].peerId = remotePeerId
      peerData.value[remotePeerId].dataConn = peer.value?.connect(remotePeerId, {})
      peerData.value[remotePeerId].displayName = displayName

      peerData.value[remotePeerId].dataConn.on('open', () => {
        // 接続された先へ表示名を送信
        const sendName = new DataConnData()
        sendName.type = 'display_name'
        sendName.senderPeerId = myPeerId.value
        sendName.message = myName.value
        peerData.value[remotePeerId].dataConn.send(sendName)

        // 接続されたことの告知 送信
        const sendData = new DataConnData()
        sendData.type = 'message'
        sendData.senderPeerId = myPeerId.value
        sendData.message = '接続しました。'
        peerData.value[remotePeerId].dataConn.send(sendData)
        dataConnData.value.push(sendData)
      })

      peerData.value[remotePeerId].dataConn.on('data', (data: DataConnData) => {
        switch (data.type) {
          case 'display_name':
            peerData.value[remotePeerId].displayName = data.message
            break
          case 'message':
            // 受信データの表示
            dataConnData.value.push(data)
            break
        }
      })

      peerData.value[remotePeerId].dataConn.on('close', () => {
        peerData.value[remotePeerId].dataConn.close()
      })

      peerData.value[remotePeerId].dataConn.on('error', (err: any) => {
        console.log('--- dataConn: peer on(error) ---', err)
      })
    }
  }

  // Data メッセージの送信
  function sendDataAll(sendText: string) {
    const sendData = new DataConnData()
    sendData.type = 'message'
    sendData.senderPeerId = myPeerId.value
    sendData.message = sendText

    Object.keys(peerData.value).forEach((remotePeerId) => {
      if (remotePeerId !== myPeerId.value) {
        peerData.value[remotePeerId].dataConn.send(sendData)
      }
    })
    dataConnData.value.push(sendData)
  }

  // Data 切断
  function disconnectData() {
    Object.keys(peerData.value).forEach((remotePeerId) => {
      if (remotePeerId !== myPeerId.value) {
        peerData.value[remotePeerId].dataConn.close()
      }
    })
  }

  async function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()
    disconnectData()

    // Peer切断
    peer.value?.disconnect()
    myPeerId.value = ''
    localStorage.setItem('peer_id', '')
  }

  function checkMedias(statusRoomRes: any) {
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
    peerData,
    dataConnData,
    errorCallbackFunc,

    open,
    close,
    connectMedia,
    disconnectMedia,
    checkMedias,
    connectData,
    sendDataAll,
    disconnectData
  }
})
