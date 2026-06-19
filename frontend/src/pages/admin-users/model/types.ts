import type { SelectOption } from 'naive-ui'
import type { UserRole } from '@/entities/user'

export type AdminUserDialogMode = 'create' | 'edit'

export interface AdminUserFormState {
  username: string
  password: string
  role: UserRole
  is_active: boolean
}

export type RoleOption = SelectOption & { value: UserRole }
