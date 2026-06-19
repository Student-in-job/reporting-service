import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import '@fontsource-variable/inter/index.css'
import '@/app/styles/main.scss'

import App from './App.vue'
import { router } from '@/router'
import { setUnauthorizedHandler } from '@/shared/api'
import { RouteNames } from '@/shared/config/routes'
import { useSessionStore } from '@/entities/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

app.use(VueQueryPlugin, { queryClient })

setUnauthorizedHandler(() => {
  const session = useSessionStore()
  session.logout()
  if (router.currentRoute.value.name === RouteNames.LOGIN) return
  router.replace({
    name: RouteNames.LOGIN,
    query: { redirect: router.currentRoute.value.fullPath },
  })
})

app.mount('#app')
