import axios, { AxiosError, type AxiosInstance } from 'axios'
import { ApiError } from './ApiError'
import { clearToken, getToken } from './token'

const SKIP_TOAST_HEADER = 'x-skip-toast'

let onUnauthorized: (() => void) | null = null
let onErrorToast: ((message: string) => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function setErrorToastHandler(handler: (message: string) => void) {
  onErrorToast = handler
}

interface ApiErrorPayload {
  detail?: string | null
  message?: string | null
}

export function setupInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (response) =>
      response.config.responseType === 'blob' ? response : response.data,
    (error: AxiosError<ApiErrorPayload>) => {
      const skipToast =
        error.config?.headers?.[SKIP_TOAST_HEADER] === '1' ||
        axios.isCancel(error)

      if (error.response) {
        const { status, data } = error.response
        const message = data?.detail ?? data?.message ?? error.message

        if (status === 401) {
          clearToken()
          onUnauthorized?.()
        }

        if (!skipToast && message) {
          onErrorToast?.(message)
        }

        return Promise.reject(new ApiError(status, message ?? '', data))
      }

      if (!skipToast) onErrorToast?.(error.message)
      return Promise.reject(new ApiError(0, error.message))
    },
  )
}
