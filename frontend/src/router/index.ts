import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '@/entities/user'
import { RouteNames } from '@/shared/config/routes'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const session = useSessionStore()

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: RouteNames.LOGIN, query: { redirect: to.fullPath } }
  }

  if (to.meta.role === 'admin' && !session.isAdmin) {
    return { name: RouteNames.HOME }
  }

  if (to.name === RouteNames.LOGIN && session.isAuthenticated) {
    return { name: RouteNames.HOME }
  }
})
