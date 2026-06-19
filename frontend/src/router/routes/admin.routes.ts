import type { RouteRecordRaw } from 'vue-router'
import {
  DocumentTextOutline,
  PeopleOutline,
  ServerOutline,
} from '@vicons/ionicons5'
import { RouteNames } from '@/shared/config/routes'

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: 'admin/reports',
    name: RouteNames.ADMIN_REPORTS,
    component: () => import('@/pages/admin-reports/ui/AdminReportsPage.vue'),
    meta: {
      requiresAuth: true,
      role: 'admin',
      title: 'Отчёты',
      icon: DocumentTextOutline,
    },
  },
  {
    path: 'admin/datasources',
    name: RouteNames.ADMIN_DATASOURCES,
    component: () =>
      import('@/pages/admin-datasources/ui/AdminDatasourcesPage.vue'),
    meta: {
      requiresAuth: true,
      role: 'admin',
      title: 'Источники данных',
      icon: ServerOutline,
    },
  },
  {
    path: 'admin/users',
    name: RouteNames.ADMIN_USERS,
    component: () => import('@/pages/admin-users/ui/AdminUsersPage.vue'),
    meta: {
      requiresAuth: true,
      role: 'admin',
      title: 'Пользователи',
      icon: PeopleOutline,
    },
  },
]
