import type { Datasource } from '../model/types'

export type ApiDatasource = Datasource

export interface ApiDatasourcesList {
  datasources: ApiDatasource[]
}

export interface DatasourceCreateDto {
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  is_active?: boolean
}

export interface DatasourceUpdateDto {
  name?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  is_active?: boolean
}

export type DatasourceTestStatus = 'ok' | 'error'

export interface DatasourceTestOut {
  status: DatasourceTestStatus
  response_time_ms?: number | null
  detail?: string | null
}
