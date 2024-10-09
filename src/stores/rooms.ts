import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'
import Room from '@/lib/Room'

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room>(new Room())
  const rooms = ref<Room[]>([])

  async function getRooms() {
    rooms.value = []
    const options = {}
    const response = await axios.get('/api/rooms', options)
    rooms.value = response.data
  }

  async function newRoom() {
    room.value = new Room()
  }

  async function createRoom() {
    const options = room.value
    await axios.post('/api/rooms', options)
  }

  async function getRoom(id: number) {
    room.value = new Room()
    const options = {}
    const response = await axios.get('/api/rooms/' + id, options)
    room.value = new Room(response.data)
  }

  async function getRoomByRoomHash(roomHash: string) {
    room.value = new Room()
    const options = {}
    const response = await axios.get('/api/rooms/hash/' + roomHash, options)
    room.value = new Room(response.data)
  }

  async function updateRoom(id: number) {
    const options = room.value
    await axios.put('/api/rooms/' + id, options)
  }

  async function deleteRoom(id: number) {
    const options = {}
    await axios.delete('/api/rooms/' + id, options)
  }

  return {
    room,
    rooms,
    getRooms,
    getRoom,
    getRoomByRoomHash,
    newRoom,
    createRoom,
    updateRoom,
    deleteRoom
  }
})
