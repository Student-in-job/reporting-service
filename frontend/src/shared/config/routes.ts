export const RouteNames = {
  LOGIN: 'LOGIN',
  HOME: 'HOME',
  REPORTS_SHOW: 'REPORTS_SHOW',
  ADMIN_REPORTS: 'ADMIN_REPORTS',
  ADMIN_DATASOURCES: 'ADMIN_DATASOURCES',
  ADMIN_USERS: 'ADMIN_USERS',
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]
