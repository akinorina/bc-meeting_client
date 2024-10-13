/**
 * RoomAttender data class
 */
export default class RoomAttender {
  // ID
  id: number = 0

  // 出席者 Peer ID.
  peer_id: string = ''

  constructor(roomAttender: any = {}) {
    this.id = roomAttender.id ?? 0
    this.peer_id = roomAttender.peer_id
  }
}
