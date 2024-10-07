import './assets/scss/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { CkeditorPlugin } from '@ckeditor/ckeditor5-vue'

import App from './App.vue'
import router from './router'

import { errorHandler } from './lib/ErrorHandler'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(CkeditorPlugin)

app.config.errorHandler = errorHandler

app.mount('#app')
