import type { RouteRecordRaw } from 'vue-router'
import { HomeOutline } from '@vicons/ionicons5'
import { RouteNames } from '@/shared/config/routes'

export const reportsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: RouteNames.HOME,
    component: () => import('@/pages/home/ui/HomePage.vue'),
    meta: { title: 'Главная', icon: HomeOutline },
  },
  {
    path: 'reports/:id',
    name: RouteNames.REPORTS_SHOW,
    component: () => import('@/pages/report-show/ui/ReportShowPage.vue'),
    props: true,
  },
]
