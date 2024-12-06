import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { Peer } from 'peerjs'
import type { MediaConnection, DataConnection, PeerOptions } from 'peerjs'

export class PeerMedia {
  peerId: string = ''
  mediaConn: MediaConnection | undefined = undefined
  mediaStream: MediaStream | undefined = undefined
  available: boolean = false
  dataConn: DataConnection | undefined = undefined
  displayName: string = ''
}
interface PeerMediaObject {
  [key: string]: PeerMedia
}

export class DataConnData {
  type: string = ''
  senderPeerId: string = ''
  message: string = ''
}

export const useWebrtcStore = defineStore('webrtc', () => {
  // my peer name.
  const myName = ref('')

  // peer
  const peer = ref<Peer>()

  // my Peer ID.
  const myPeerId = ref<string>('')

  // my Media Stream
  const myMediaStream = ref<MediaStream | null>(null)

  // num of Peers
  const numOfPeers = ref(0)

  // PeerMedia
  const peerMedias = ref<PeerMediaObject>({})
  watch(peerMedias, () => {
    numOfPeers.value = Object.keys(peerMedias).length
  })

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
    peer.value = new Peer({
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
      if (!peer.value) return

      myPeerId.value = peer.value && peer.value.id ? peer.value.id : ''

      // on: Peer Data接続 - 相手からの接続
      peer.value.on('connection', (conn: DataConnection) => {
        console.info('--- peer.on(connection) ---')
        const remotePeerId = conn.peer
        if (!peerMedias.value[remotePeerId]) {
          peerMedias.value[remotePeerId] = new PeerMedia()
        }
        peerMedias.value[remotePeerId].available = true
        peerMedias.value[remotePeerId].peerId = remotePeerId
        peerMedias.value[remotePeerId].dataConn = conn

        // on data: Data接続 確立
        peerMedias.value[remotePeerId].dataConn?.on('open', async () => {
          if (myPeerId.value === '') {
            throw new Error('not enough data: myPeerId.value')
          }
          // 接続された先へ表示名を送信
          const sendName = new DataConnData()
          sendName.type = 'request_display_name'
          sendName.senderPeerId = myPeerId.value
          sendName.message = myName.value
          await peerMedias.value[remotePeerId].dataConn?.send(sendName)
          // console.log('send: ', sendName)
        })

        // on data: Data接続 受信
        peerMedias.value[remotePeerId].dataConn?.on('data', (dataUnknown: unknown) => {
          let sendName: DataConnData | undefined = undefined
          const data = dataUnknown as DataConnData
          switch (data.type) {
            case 'request_display_name':
              // 接続された先の表示名を格納
              // console.log('received: ', data)
              peerMedias.value[remotePeerId].displayName = data.message
              // 接続された先へ表示名を要求
              sendName = new DataConnData()
              sendName.type = 'send_display_name'
              sendName.senderPeerId = myPeerId.value
              sendName.message = myName.value
              peerMedias.value[remotePeerId].dataConn?.send(sendName)
              // console.log('send: ', sendName)
              break
            case 'send_display_name':
              // 接続された先の表示名を格納
              // console.log('received: ', data)
              peerMedias.value[remotePeerId].displayName = data.message
              break
            case 'message':
              // 受信データの表示
              dataConnData.value.push(data)
              break
          }
        })

        // on data: Data接続 切断された
        peerMedias.value[remotePeerId].dataConn?.on('close', () => {
          if (peerMedias.value[remotePeerId].dataConn) {
            // dataConn 切断 & clean up.
            peerMedias.value[remotePeerId].dataConn?.close()
            // dataConn 削除
            delete peerMedias.value[remotePeerId].dataConn
          }
        })

        // on data: Data接続 error
        peerMedias.value[remotePeerId].dataConn?.on('error', (error: unknown) => {
          console.error('--- dataConn.on(error) ---', error)
        })
      })

      // on: Peer Media接続 呼び出しあり
      peer.value.on('call', (call: MediaConnection) => {
        console.info('--- peer.on(call) ---')
        if (myMediaStream.value === null) {
          throw new Error('not enough data: myMediaStream.value')
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
        peerMedias.value[remotePeerId].mediaConn?.answer(myMediaStream.value)

        // on media: Remote Peer のストリーム取得時
        peerMedias.value[remotePeerId].mediaConn?.on('stream', (remoteStream: MediaStream) => {
          peerMedias.value[remotePeerId].mediaStream = remoteStream
        })

        // on media: Media接続 切断
        peerMedias.value[remotePeerId].mediaConn?.on('close', () => {
          console.error('--- mediaConn.on(close) ---')

          // closeした MediaStream停止
          peerMedias.value[remotePeerId].mediaStream
            ?.getTracks()
            .forEach((track: MediaStreamTrack) => track.stop())

          // closeした MediaConnection CLOSE
          if (peerMedias.value[remotePeerId].mediaConn) {
            // mediaConn 閉じる
            peerMedias.value[remotePeerId].mediaConn?.close()
            // mediaConn 削除
            delete peerMedias.value[remotePeerId].mediaConn
          }

          // peerMedia 無効化
          peerMedias.value[remotePeerId].available = false
          setTimeout(() => {
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
        peerMedias.value[remotePeerId].mediaConn?.on('error', (error: any) => {
          console.error('--- mediaConn.on(error) ---', error)
          console.error('mediaconn error name', error.name)
          console.error('mediaconn error type', error.type)
          console.error('mediaconn error message', error.message)
        })

        // peer.on(call) callback
        const options = { peer_id: remotePeerId }
        peerOnCallCallback.value(options)
      })
    })

    // on: Peer接続が切断された
    peer.value.on('disconnected', (currentId: string) => {
      console.warn('--- peer.on(disconnected) ---', currentId)
    })

    // on: Peer接続が破壊され、再接続できない
    peer.value.on('close', () => {
      console.warn('--- peer.on(close) ---')
      myPeerId.value = ''
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
        // console.info('--- peer-unavailable ---')
        const ma = err.message.match(/(\w+-\w+-\w+-\w+-\w+)/)
        if (ma) {
          // console.info('error peer id.', ma[1])
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
      peerMedias.value[remotePeerId].mediaConn = undefined
      peerMedias.value[remotePeerId].mediaStream = myMediaStream.value
      peerMedias.value[remotePeerId].dataConn = undefined
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

      peerMedias.value[remotePeerId].mediaConn?.on('stream', function (remoteStream: MediaStream) {
        peerMedias.value[remotePeerId].mediaStream = remoteStream
      })

      peerMedias.value[remotePeerId].mediaConn?.on('close', async () => {
        if (peerMedias.value[remotePeerId].mediaStream) {
          // MediaStream 停止
          peerMedias.value[remotePeerId].mediaStream
            ?.getTracks()
            .forEach((track: MediaStreamTrack) => track.stop())
          // MediaStream 削除
          delete peerMedias.value[remotePeerId].mediaStream
        }
        if (peerMedias.value[remotePeerId].mediaConn) {
          // MediaConnection CLOSE
          peerMedias.value[remotePeerId].mediaConn?.close()
          // MediaConnection 削除
          delete peerMedias.value[remotePeerId].mediaConn
        }

        // peerMedia 無効化
        peerMedias.value[remotePeerId].available = false
        setTimeout(() => {
          if (peerMedias.value[remotePeerId] && !peerMedias.value[remotePeerId].available) {
            delete peerMedias.value[remotePeerId]
          }

          const options = {
            peer_id: remotePeerId
          }
          mediaConnOnCloseCallback.value(options)
        }, 1000)
      })

      peerMedias.value[remotePeerId].mediaConn?.on('error', async (error: unknown) => {
        console.error('--- mediaConn: peer on(error) ---', error)
      })

      // Peer DataConn 接続確立
      peerMedias.value[remotePeerId].dataConn?.on('open', () => {
        // 接続された先へ表示名を要求
        const sendName = new DataConnData()
        sendName.type = 'request_display_name'
        sendName.senderPeerId = myPeerId.value
        sendName.message = myName.value
        peerMedias.value[remotePeerId].dataConn?.send(sendName)
        // console.log('send: ', sendName)
      })

      // Peer DataConn データ受信
      peerMedias.value[remotePeerId].dataConn?.on('data', (dataUnknown: unknown) => {
        let sendName: DataConnData | undefined = undefined
        const data = dataUnknown as DataConnData
        switch (data.type) {
          case 'request_display_name':
            // 接続された先の表示名を格納
            // console.log('received: ', data)
            peerMedias.value[remotePeerId].displayName = data.message
            // 接続された先へ表示名を要求
            sendName = new DataConnData()
            sendName.type = 'send_display_name'
            sendName.senderPeerId = myPeerId.value
            sendName.message = myName.value
            peerMedias.value[remotePeerId].dataConn?.send(sendName)
            // console.log('send: ', sendName)
            break
          case 'send_display_name':
            // 接続された先の表示名を格納
            // console.log('received: ', data)
            peerMedias.value[remotePeerId].displayName = data.message
            break
          case 'message':
            // 受信データの表示
            dataConnData.value.push(data)
            break
        }
      })

      // Peer DataConn 切断
      peerMedias.value[remotePeerId].dataConn?.on('close', () => {
        if (peerMedias.value[remotePeerId].dataConn) {
          peerMedias.value[remotePeerId].dataConn?.close()
          delete peerMedias.value[remotePeerId].dataConn
        }
      })

      // Peer DataConn エラー
      peerMedias.value[remotePeerId].dataConn?.on('error', (error: unknown) => {
        console.error('--- dataConn: peer on(error) ---', error)
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
        if (peerMedias.value[peerId].dataConn) {
          peerMedias.value[peerId].dataConn?.close()
          delete peerMedias.value[peerId].dataConn
        }

        // MediaStream 停止 ＆ 削除
        if (peerMedias.value[peerId].mediaStream) {
          peerMedias.value[peerId].mediaStream
            ?.getTracks()
            .forEach((track: MediaStreamTrack) => track.stop())
          delete peerMedias.value[peerId].mediaStream
        }

        // MediaConnection CLOSE
        if (peerMedias.value[peerId].mediaConn) {
          peerMedias.value[peerId].mediaConn?.close()
          delete peerMedias.value[peerId].mediaConn
        }

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
    })
  }

  // Media(Video) track 置き換え
  function replaceVideoTrackToPeerConnection(mediaStream: MediaStream): void {
    Object.keys(peerMedias.value).forEach((peerId) => {
      peerMedias.value[peerId].mediaConn?.replaceVideoTrackToPeerConnection(mediaStream)
    })
  }

  // Media(Audio) track 置き換え
  function replaceAudioTrackToPeerConnection(mediaStream: MediaStream): void {
    Object.keys(peerMedias.value).forEach((peerId) => {
      peerMedias.value[peerId].mediaConn?.replaceAudioTrackToPeerConnection(mediaStream)
    })
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
        peerMedias.value[remotePeerId].dataConn?.send(sendData)
        // console.log('send: ', sendData)
      }
    })
    dataConnData.value.push(sendData)
  }

  // PeerConnection の Video の Enabled を操作
  function changeVideoEnabledToPeerConnection(value: boolean): void {
    Object.keys(peerMedias.value).forEach((peerId) => {
      if (peerId !== myPeerId.value) {
        peerMedias.value[peerId].mediaConn?.changeVideoTrackEnabled(value)
      }
    })
  }

  // PeerConnection の Audio の Enabled を操作
  function changeAudioEnabledToPeerConnection(value: boolean): void {
    Object.keys(peerMedias.value).forEach((peerId) => {
      if (peerId !== myPeerId.value) {
        peerMedias.value[peerId].mediaConn?.changeAudioTrackEnabled(value)
      }
    })
  }

  async function close() {
    // stream の全Trackをstop, 削除
    disconnectMedia()
    peerMedias.value = {}

    // Peer切断
    peer.value?.destroy()
    myPeerId.value = ''
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
          if (peerMedias.value[peerId].mediaStream) {
            peerMedias.value[peerId].mediaStream
              ?.getTracks()
              .forEach((track: MediaStreamTrack) => track.stop())
            delete peerMedias.value[peerId].mediaStream
          }

          if (peerMedias.value[peerId].mediaConn) {
            // MediaConnection CLOSE
            peerMedias.value[peerId].mediaConn?.close()
            // MediaConnection 削除
            delete peerMedias.value[peerId].mediaConn
          }

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

  // peerID => DisplayName 取得
  function getDisplayName(peerId: string) {
    let targetDisplayName = ''
    Object.keys(peerMedias.value).forEach((sKey) => {
      if (peerMedias.value[sKey].peerId === peerId) {
        targetDisplayName = peerMedias.value[sKey].displayName
      }
    })

    return targetDisplayName
  }

  // 表示名をすべての人に送信
  function sendMyNameToAll() {
    Object.keys(peerMedias.value).forEach(async (remotePeerId) => {
      // 接続された先へ表示名を送信
      const sendName = new DataConnData()
      sendName.type = 'request_display_name'
      sendName.senderPeerId = myPeerId.value
      sendName.message = myName.value
      await peerMedias.value[remotePeerId].dataConn?.send(sendName)
      // console.log('send: ', sendName)
    })
  }

  return {
    myName,
    myPeerId,
    myMediaStream,
    peerMedias,
    numOfPeers,
    dataConnData,
    peerOnCallCallback,
    peerOnErrorCallback,
    mediaConnOnCloseCallback,

    open,
    close,
    connectMedia,
    disconnectMedia,
    checkMedias,
    sendDataAll,
    sendMyNameToAll,
    getDisplayName,
    replaceVideoTrackToPeerConnection,
    replaceAudioTrackToPeerConnection,
    changeVideoEnabledToPeerConnection,
    changeAudioEnabledToPeerConnection,
    showInfoLog
  }
})
