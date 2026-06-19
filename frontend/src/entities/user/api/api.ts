import { api } from '@/shared/api'
import type {
  ApiLoginResponse,
  ApiUser,
  ApiUsersList,
  LoginDto,
  UserCreateDto,
  UserUpdateDto,
} from './types'

export const userAPI = {
  login(dto: LoginDto) {
    return api.post<ApiLoginResponse>('/auth/login', dto)
  },
  me() {
    return api.get<ApiUser>('/auth/me')
  },
}

export const usersAPI = {
  list() {
    return api.get<ApiUsersList>('/admin/users')
  },
  create(dto: UserCreateDto) {
    return api.post<ApiUser>('/admin/users', dto)
  },
  update(id: string, dto: UserUpdateDto) {
    return api.put<ApiUser>(`/admin/users/${id}`, dto)
  },
  remove(id: string) {
    return api.delete<void>(`/admin/users/${id}`)
  },
}
