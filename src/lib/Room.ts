/**
 * Room data class
 */
export default class Room {
  // ID
  id: number = 0

  // Roomハッシュ
  room_hash: string = ''

  // Room名称
  room_name: string = ''

  constructor(room: any = {}) {
    this.id = room.id ?? 0
    this.room_hash = room.room_hash
    this.room_name = room.room_name
  }
}
