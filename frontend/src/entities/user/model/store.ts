import { clearToken, getToken, setToken } from '@/shared/api'
import { userAPI } from '../api'
import type { User, UserRole } from './types'

const USER_KEY = 'ps_user'

function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(loadUser())
  const token = ref<string | null>(getToken())
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await userAPI.login({ username, password })
      setToken(res.access_token)
      token.value = res.access_token
      user.value = res.user
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearToken()
    localStorage.removeItem(USER_KEY)
    token.value = null
    user.value = null
  }

  async function fetchMe() {
    const me = await userAPI.me()
    user.value = me
    localStorage.setItem(USER_KEY, JSON.stringify(me))
    return me
  }

  function hasRole(role: UserRole) {
    if (!user.value) return false
    if (role === 'viewer') return true
    return user.value.role === role
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    fetchMe,
    hasRole,
  }
})
