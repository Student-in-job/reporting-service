import { createApp, nextTick } from 'vue'
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

let redirecting = false

setUnauthorizedHandler(async () => {
  const session = useSessionStore()
  session.logout()

  if (redirecting || router.currentRoute.value.name === RouteNames.LOGIN) return
  redirecting = true

  await nextTick()
  try {
    await router.replace({
      name: RouteNames.LOGIN,
      query: { redirect: router.currentRoute.value.fullPath },
    })
  } finally {
    redirecting = false
  }
})

app.mount('#app')
