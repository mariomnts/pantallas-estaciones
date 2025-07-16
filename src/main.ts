import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

if (import.meta.env.PROD && typeof window !== 'undefined') {
  const legitimateDomain = 'pantallas-estaciones.vercel.app'
  const currentDomain = window.location.hostname

  if (currentDomain !== legitimateDomain) {
    const newUrl = `https://${legitimateDomain}${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.replace(newUrl)
  }
}

const app = createApp(App)

app.use(router)

app.mount('#app')
