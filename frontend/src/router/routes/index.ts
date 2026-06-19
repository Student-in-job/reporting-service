import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '@/shared/config/routes'
import { authRoutes } from './auth.routes'
import { reportsRoutes } from './reports.routes'
import { adminRoutes } from './admin.routes'

export const routes: RouteRecordRaw[] = [
  ...authRoutes,
  {
    path: '/',
    component: () => import('@/widgets/main-layout/ui/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [...reportsRoutes, ...adminRoutes],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: RouteNames.HOME } },
]
