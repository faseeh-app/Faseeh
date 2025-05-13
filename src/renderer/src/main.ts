import '@/common/assets/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@/common/router/routes'

const pinia = createPinia()
export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
