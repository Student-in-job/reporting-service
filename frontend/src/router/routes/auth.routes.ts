import type { RouteRecordRaw } from 'vue-router'
import { RouteNames } from '@/shared/config/routes'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/widgets/auth-layout/ui/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: RouteNames.LOGIN,
        component: () => import('@/pages/login/ui/LoginPage.vue'),
      },
    ],
  },
]
