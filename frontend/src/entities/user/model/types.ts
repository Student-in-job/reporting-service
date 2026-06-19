export type UserRole = 'admin' | 'viewer'

export interface User {
  id: string
  username: string
  role: UserRole
  is_active?: boolean
  created_at?: string
}
