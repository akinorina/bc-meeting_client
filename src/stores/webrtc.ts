import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Peer } from 'peerjs'
import type { MediaConnection, DataConnection, PeerOptions } from 'peerjs'

export class PeerMedia {
  peerId: string = ''
  mediaConn: any = undefined
  mediaStream: any = undefined
  available: boolean = false
  dataConn: any = undefined
  displayName: string = ''
}
interface PeerMediaObject {
  [key: string]: PeerMedia
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

  // 送受信メッセージデータ
  const dataConnData = ref<DataConnData[]>([])

  // peer.on(call) callback
  const peerOnCallCallback = ref<Function>(() => {})

  // peer.on(error) callback
  const peerOnErrorCallback = ref<Function>(() => {})

  // mediaConn.on(close) callback
  const mediaConnOnCloseCallback = ref<Function>(() => {})

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
      console.info('--- peer.on(open) ---')
      myPeerId.value = peer.value ? peer.value.id : ''
      localStorage.setItem('peer_id', myPeerId.value)
    })

    // on: Peer接続が切断された
    peer.value.on('disconnected', () => {
      console.warn('--- peer.on(disconnected) ---')
      myPeerId.value = ''
      localStorage.setItem('peer_id', '')
    })

    // on: Peer接続が破壊され、再接続できない
    peer.value.on('close', () => {
      console.warn('--- peer.on(close) ---')
      myPeerId.value = ''
      localStorage.setItem('peer_id', '')
    })

    // on: Peer Data接続 確立
    peer.value.on('connection', (conn: DataConnection) => {
      console.info('--- peer.on(connection) ---')
      const remotePeerId = conn.peer
      if (!peerMedias.value[remotePeerId]) {
        peerMedias.value[remotePeerId] = new PeerMedia()
      }
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].dataConn = conn

      // on data: Data接続確立
      peerMedias.value[remotePeerId].dataConn.on('open', () => {
        // 接続された先へ表示名を送信
        const sendName = new DataConnData()
        sendName.type = 'display_name'
        sendName.senderPeerId = myPeerId.value
        sendName.message = myName.value
        peerMedias.value[remotePeerId].dataConn.send(sendName)

        // 接続されたことの告知 送信
        const sendData = new DataConnData()
        sendData.type = 'message'
        sendData.senderPeerId = myPeerId.value
        sendData.message = '接続しました。'
        peerMedias.value[remotePeerId].dataConn.send(sendData)
        dataConnData.value.push(sendData)
      })

      // on data: Data受信
      peerMedias.value[remotePeerId].dataConn.on('data', (data: DataConnData) => {
        switch (data.type) {
          case 'display_name':
            peerMedias.value[remotePeerId].displayName = data.message
            break
          case 'message':
            // 受信データの表示
            dataConnData.value.push(data)
            break
        }
      })

      // on data: Data接続を切断された
      peerMedias.value[remotePeerId].dataConn.on('close', () => {
        // Data接続 切断 & clean up.
        peerMedias.value[remotePeerId].dataConn.close()

        // dataConn 削除
        delete peerMedias.value[remotePeerId].dataConn
      })

      // on data: error
      peerMedias.value[remotePeerId].dataConn.on('error', (err: any) => {
        console.error('--- dataConn.on(error) ---', err)
      })
    })

    // on: Peer Media接続 呼び出しあり
    peer.value.on('call', (call: MediaConnection) => {
      console.info('--- peer.on(call) ---')
      if (myMediaStream.value === null || !call) {
        return false
      }

      const remotePeerId: string = call.peer
      if (!peerMedias.value[remotePeerId]) {
        peerMedias.value[remotePeerId] = new PeerMedia()
      }
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId

      // media接続を確保
      peerMedias.value[remotePeerId].mediaConn = call

      // Peer Media接続へ応答
      peerMedias.value[remotePeerId].mediaConn.answer(myMediaStream.value)

      // on media: Remote Peer のストリーム取得時
      peerMedias.value[remotePeerId].mediaConn.on('stream', (remoteStream: any) => {
        peerMedias.value[remotePeerId].mediaStream = remoteStream
      })

      // on media: Media接続 切断
      peerMedias.value[remotePeerId].mediaConn.on('close', async (err: any) => {
        console.error('--- mediaConn.on(close) ---', err)

        // closeした MediaStream停止
        await peerMedias.value[remotePeerId].mediaStream
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // closeした MediaConnection CLOSE
        await peerMedias.value[remotePeerId].mediaConn?.close()

        // mediaConn 削除
        delete peerMedias.value[remotePeerId].mediaConn

        // peerMedia 無効化
        peerMedias.value[remotePeerId].available = false
        setTimeout(() => {
          // console.log('delete 1')
          if (peerMedias.value[remotePeerId] && !peerMedias.value[remotePeerId].available) {
            delete peerMedias.value[remotePeerId]
          }

          const options = {
            peer_id: remotePeerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      })

      // on media: error
      peerMedias.value[remotePeerId].mediaConn?.on('error', (err: any) => {
        console.error('--- mediaConn.on(error) ---', err)
        console.error('mediaconn error name', err.name)
        console.error('mediaconn error type', err.type)
        console.error('mediaconn error message', err.message)
      })

      // peer.on(call) callback
      const options = { peer_id: remotePeerId }
      peerOnCallCallback.value(options)
    })

    // on: error
    peer.value.on('error', (err) => {
      console.error('=== Peer on(error) ===', err)
      console.error('peer error', err.type)
      console.error('peer error', err.message)
      console.error('peer error', err.name)
      console.error('peer error', err.stack)
      console.error('peer error', err)
      console.info('peer id', peer.value?.id)
      console.info('connections', peer.value?.connections)
      console.info('disconnected', peer.value?.disconnected)
      console.info('destroyed', peer.value?.destroyed)

      const options: any = {}
      if (err.type === 'peer-unavailable') {
        console.info('--- peer-unavailable ---')
        const ma = err.message.match(/(\w+-\w+-\w+-\w+-\w+)/)
        if (ma) {
          console.info('error peer id.', ma[1])
          options.type = 'peer-unavailable'
          options.peer_id = ma[1]
        }

        peerOnErrorCallback.value(options)
      }
    })
  }

  // Media 接続
  async function connectMedia(remotePeerId: string, displayName: string) {
    if (!peer.value || !myMediaStream.value) {
      return false
    }

    if (remotePeerId === myPeerId.value) {
      // 自分のPeerId
      if (!peerMedias.value[remotePeerId]) {
        peerMedias.value[remotePeerId] = new PeerMedia()
      }
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].mediaConn = null
      peerMedias.value[remotePeerId].mediaStream = myMediaStream.value
      peerMedias.value[remotePeerId].dataConn = null
      peerMedias.value[remotePeerId].displayName = displayName
    } else {
      // 他のPeerId
      if (!peerMedias.value[remotePeerId]) {
        peerMedias.value[remotePeerId] = new PeerMedia()
      }
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].mediaConn = peer.value.call(remotePeerId, myMediaStream.value)
      peerMedias.value[remotePeerId].dataConn = peer.value?.connect(remotePeerId, {})
      peerMedias.value[remotePeerId].displayName = displayName

      peerMedias.value[remotePeerId].mediaConn.on('stream', function (remoteStream: any) {
        peerMedias.value[remotePeerId].mediaStream = remoteStream
      })

      peerMedias.value[remotePeerId].mediaConn.on('close', async () => {
        // closeした MediaStream停止
        await peerMedias.value[remotePeerId].mediaStream
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // closeした MediaConnection CLOSE
        await peerMedias.value[remotePeerId].mediaConn?.close()

        // closeした peerMedia 削除
        delete peerMedias.value[remotePeerId].mediaConn

        // peerMedia 無効化
        peerMedias.value[remotePeerId].available = false
        setTimeout(() => {
          // console.log('delete 2')
          if (peerMedias.value[remotePeerId] && !peerMedias.value[remotePeerId].available) {
            delete peerMedias.value[remotePeerId]
          }

          const options = {
            peer_id: remotePeerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      })

      peerMedias.value[remotePeerId].mediaConn.on('error', async (err: any) => {
        console.error('--- mediaConn: peer on(error) ---', err)
      })

      // Peer DataConn 接続確立
      peerMedias.value[remotePeerId].dataConn.on('open', () => {
        // 接続された先へ表示名を送信
        const sendName = new DataConnData()
        sendName.type = 'display_name'
        sendName.senderPeerId = myPeerId.value
        sendName.message = myName.value
        peerMedias.value[remotePeerId].dataConn.send(sendName)

        // 接続されたことの告知 送信
        const sendData = new DataConnData()
        sendData.type = 'message'
        sendData.senderPeerId = myPeerId.value
        sendData.message = '接続しました。'
        peerMedias.value[remotePeerId].dataConn.send(sendData)
        dataConnData.value.push(sendData)
      })

      // Peer DataConn データ受信
      peerMedias.value[remotePeerId].dataConn.on('data', (data: DataConnData) => {
        switch (data.type) {
          case 'display_name':
            peerMedias.value[remotePeerId].displayName = data.message
            break
          case 'message':
            // 受信データの表示
            dataConnData.value.push(data)
            break
        }
      })

      // Peer DataConn 切断
      peerMedias.value[remotePeerId].dataConn.on('close', () => {
        peerMedias.value[remotePeerId].dataConn.close()
        delete peerMedias.value[remotePeerId].dataConn
      })

      // Peer DataConn エラー
      peerMedias.value[remotePeerId].dataConn.on('error', (err: any) => {
        console.error('--- dataConn: peer on(error) ---', err)
      })

      // peer.on(call) callback
      const options = { peer_id: remotePeerId }
      peerOnCallCallback.value(options)
    }

    return true
  }

  // Media 切断
  function disconnectMedia() {
    // PeerMediaすべてを停止、Close、削除
    Object.keys(peerMedias.value).forEach(async (peerId) => {
      if (peerId !== myPeerId.value) {
        // DataConnection CLOSE
        await peerMedias.value[peerId].dataConn?.close()

        // MediaStream停止
        await peerMedias.value[peerId].mediaStream
          ?.getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // MediaConnection CLOSE
        await peerMedias.value[peerId].mediaConn?.close()

        // peerMedia 削除
        delete peerMedias.value[peerId].dataConn
        delete peerMedias.value[peerId].mediaConn

        // peerMedia 無効化
        peerMedias.value[peerId].available = false
        setTimeout(() => {
          // console.log('delete 4')
          if (peerMedias.value[peerId] && !peerMedias.value[peerId].available) {
            delete peerMedias.value[peerId]
          }

          const options = {
            peer_id: peerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      }
    })
  }

  // Media 切断 2
  async function disconnectMedia2() {
    // PeerMediaすべてを停止、Close、削除
    Object.keys(peerMedias.value).forEach(async (peerId) => {
      if (peerId !== myPeerId.value) {
        // MediaStream停止
        await peerMedias.value[peerId].mediaStream
          ?.getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // MediaConnection CLOSE
        await peerMedias.value[peerId].mediaConn?.close()

        // peerMedia 無効化
        peerMedias.value[peerId].available = false
        setTimeout(() => {
          // console.log('delete 5')
          if (peerMedias.value[peerId] && !peerMedias.value[peerId].available) {
            delete peerMedias.value[peerId]
          }

          const options = {
            peer_id: peerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      }
    })
  }

  // Media 接続 2
  async function connectMedia2(remotePeerId: string) {
    if (!peer.value || !myMediaStream.value) {
      return false
    }

    if (remotePeerId === myPeerId.value) {
      // 自分のPeerId
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].mediaConn = null
      peerMedias.value[remotePeerId].mediaStream = myMediaStream.value
    } else {
      // 他のPeerId
      if (!peerMedias.value[remotePeerId]) {
        peerMedias.value[remotePeerId] = new PeerMedia()
      }
      peerMedias.value[remotePeerId].available = true
      peerMedias.value[remotePeerId].peerId = remotePeerId
      peerMedias.value[remotePeerId].mediaConn = peer.value.call(remotePeerId, myMediaStream.value)

      peerMedias.value[remotePeerId].mediaConn.on('stream', function (remoteStream: any) {
        peerMedias.value[remotePeerId].mediaStream = remoteStream
      })

      peerMedias.value[remotePeerId].mediaConn.on('close', async () => {
        // closeした MediaStream停止
        await peerMedias.value[remotePeerId].mediaStream
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop())

        // closeした MediaConnection CLOSE
        await peerMedias.value[remotePeerId].mediaConn?.close()

        // closeした peerMedia 削除
        delete peerMedias.value[remotePeerId].mediaConn

        // peerMedia 無効化
        peerMedias.value[remotePeerId].available = false
        setTimeout(() => {
          // console.log('delete 3')
          if (peerMedias.value[remotePeerId] && !peerMedias.value[remotePeerId].available) {
            delete peerMedias.value[remotePeerId]
          }

          const options = {
            peer_id: remotePeerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      })

      peerMedias.value[remotePeerId].mediaConn.on('error', async (err: any) => {
        console.error('--- mediaConn: peer on(error) ---', err)
      })

      // peer.on(call) callback
      const options = { peer_id: remotePeerId }
      peerOnCallCallback.value(options)
    }

    return true
  }

  // Peer DataConn メッセージの送信
  function sendDataAll(sendText: string) {
    // メッセージ作成
    const sendData = new DataConnData()
    sendData.type = 'message'
    sendData.senderPeerId = myPeerId.value
    sendData.message = sendText
    // 接続中すべてへ送信
    Object.keys(peerMedias.value).forEach((remotePeerId) => {
      if (remotePeerId !== myPeerId.value) {
        peerMedias.value[remotePeerId].dataConn.send(sendData)
      }
    })
    dataConnData.value.push(sendData)
  }

  async function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()
    peerMedias.value = {}

    // Peer切断
    peer.value?.destroy()
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
        if (peerId !== myPeerId.value) {
          // MediaStream停止
          await peerMedias.value[peerId].mediaStream
            ?.getTracks()
            .forEach((track: MediaStreamTrack) => track.stop())

          // MediaConnection CLOSE
          await peerMedias.value[peerId].mediaConn?.close()

          // peerMedia 削除
          delete peerMedias.value[peerId].mediaConn
          // peerMedia 無効化
          peerMedias.value[peerId].available = false
          setTimeout(() => {
            if (peerMedias.value[peerId] && !peerMedias.value[peerId].available) {
              delete peerMedias.value[peerId]
            }

            const options = {
              peer_id: peerId
            }
            mediaConnOnCloseCallback.value(options)
          }, 1000)
        }
      }
    })
  }

  // 状態をコンソール出力
  function showInfoLog() {
    console.info('peer', peer.value)
    console.info('peer', peer.value?.id)
    console.info('peer', peer.value?.disconnected)
    console.info('peer', peer.value?.destroyed)

    Object.keys(peerMedias.value).forEach((peerId) => {
      console.info('dataConn peer', peerMedias.value[peerId].displayName + ': ' + peerId)
      console.info('dataConn', peerMedias.value[peerId].dataConn)
      console.info('mediaConn peer', peerMedias.value[peerId].peerId)
    })
  }

  return {
    myName,
    myPeerId,
    myMediaStream,
    peerMedias,
    dataConnData,
    peerOnCallCallback,
    peerOnErrorCallback,
    mediaConnOnCloseCallback,

    open,
    close,
    connectMedia,
    connectMedia2,
    disconnectMedia,
    disconnectMedia2,
    checkMedias,
    sendDataAll,

    showInfoLog
  }
})
