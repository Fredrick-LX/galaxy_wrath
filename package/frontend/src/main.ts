import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import { useUserStore } from './stores/user'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// 创建 Pinia 实例并注册持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

// 恢复用户信息
const userStore = useUserStore()
userStore.restoreUser()

app.mount('#app')
