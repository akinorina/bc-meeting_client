import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'
import Image from '@/lib/Image'

export const useImagePublicStore = defineStore('image_public', () => {
  const image = ref<Image>(new Image())
  const images = ref<Image[]>([])

  async function getImages() {
    try {
      images.value = []
      const options = {}
      const response = await axios.get('/api/images/public', options)
      images.value = response.data
    } catch (err: any) {
      console.error(err.message)
    }
  }

  async function getImage(id: number) {
    try {
      image.value = new Image()
      const options = {}
      const response = await axios.get('/api/images/public/' + id, options)
      image.value = new Image(response.data)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  return { image, images, getImages, getImage }
})
