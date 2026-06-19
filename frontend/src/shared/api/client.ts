import type { AxiosRequestConfig } from 'axios'
import { apiInstance } from './apiInstance'
import { setupInterceptors } from './interceptors'

setupInterceptors(apiInstance)

export type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>

export const api = {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return apiInstance.get(url, config) as unknown as Promise<T>
  },
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return apiInstance.post(url, data, config) as unknown as Promise<T>
  },
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return apiInstance.put(url, data, config) as unknown as Promise<T>
  },
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return apiInstance.patch(url, data, config) as unknown as Promise<T>
  },
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return apiInstance.delete(url, config) as unknown as Promise<T>
  },
}
