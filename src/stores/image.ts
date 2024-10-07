import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'
import Image from '@/lib/Image'

export const useImageStore = defineStore('image', () => {
  const image = ref<Image>(new Image())
  const images = ref<Image[]>([])

  async function getImages() {
    try {
      images.value = []
      const options = {}
      const response = await axios.get('/api/images', options)
      images.value = response.data
    } catch (err: any) {
      console.error(err.message)
    }
  }

  async function getImage(id: number) {
    try {
      image.value = new Image()
      const options = {}
      const response = await axios.get('/api/images/' + id, options)
      image.value = new Image(response.data)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  async function newImage() {
    try {
      image.value = new Image()
    } catch (err: any) {
      console.error(err.message)
    }
  }

  async function createImage() {
    try {
      const options = image.value
      await axios.post('/api/images', options)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  // async function uploadImage() {
  //   try {
  //     const options = image.value
  //     console.log('options', options)
  //     await axios.post('/api/images/upload', options)
  //   } catch (err: any) {
  //     console.error(err.message)
  //   }
  // }

  async function updateImage(id: number) {
    try {
      const options = image.value
      await axios.put('/api/images/' + id, options)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  async function deleteImage(id: number) {
    try {
      const options = {}
      await axios.delete('/api/images/' + id, options)
    } catch (err: any) {
      console.error(err.message)
    }
  }

  return { image, images, getImages, getImage, newImage, createImage, updateImage, deleteImage }
})
