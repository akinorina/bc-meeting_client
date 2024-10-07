import { ref } from 'vue'
import { defineStore } from 'pinia'
import { axios } from '@/lib/Axios'
import Blog from '@/lib/Blog'

export const useBlogStore = defineStore('blog', () => {
  const blog = ref<Blog>(new Blog())
  const blogs = ref<Blog[]>([])

  async function getBlogs() {
    blogs.value = []
    const options = {}
    const response = await axios.get('/api/blogs', options)
    blogs.value = response.data
  }

  async function newBlog() {
    blog.value = new Blog()
  }

  async function createBlog() {
    const options = blog.value
    await axios.post('/api/blogs', options)
  }

  async function getBlog(id: number) {
    blog.value = new Blog()
    const options = {}
    const response = await axios.get('/api/blogs/' + id, options)
    blog.value = new Blog(response.data)
  }

  async function updateBlog(id: number) {
    const options = blog.value
    await axios.put('/api/blogs/' + id, options)
  }

  async function deleteBlog(id: number) {
    const options = {}
    await axios.delete('/api/blogs/' + id, options)
  }

  return {
    blog,
    blogs,
    getBlogs,
    getBlog,
    newBlog,
    createBlog,
    updateBlog,
    deleteBlog
  }
})
