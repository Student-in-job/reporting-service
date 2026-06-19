import type { User, UserRole } from '../model/types'

export interface LoginDto {
  username: string
  password: string
}

export interface ApiLoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export type ApiUser = User

export interface ApiUsersList {
  users: ApiUser[]
}

export interface UserCreateDto {
  username: string
  password: string
  role?: UserRole
  is_active?: boolean
}

export interface UserUpdateDto {
  password?: string
  role?: UserRole
  is_active?: boolean
}
