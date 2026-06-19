import axios from 'axios'
import { env } from '@/shared/config/env'

export const API_CONFIG = {
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
} as const

export const apiInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    Accept: 'application/json',
  },
})
