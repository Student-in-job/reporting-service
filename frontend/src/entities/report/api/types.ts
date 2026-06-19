import type {
  ColumnDef,
  ReportAdmin,
  ReportAdminConfig,
  ReportData,
  ReportListItem,
  ReportType,
} from '../model/types'

export type ApiReportListItem = ReportListItem
export type ApiReportData = ReportData
export type ApiReportAdmin = ReportAdmin

export interface ApiReportsList {
  reports: ApiReportListItem[]
}

export interface ReportRunDto {
  date_from: string
  date_to: string
  filters?: Record<string, unknown>
}

export interface ReportsListParams {
  group?: string
}

export interface ReportCreateDto {
  slug: string
  name: string
  description?: string | null
  group?: string | null
  type?: ReportType
  datasource_id: string
  sql_query: string
  columns?: ColumnDef[]
  config?: ReportAdminConfig
}

export interface ReportUpdateDto {
  slug?: string
  name?: string
  description?: string | null
  group?: string | null
  type?: ReportType
  datasource_id?: string
  sql_query?: string
  columns?: ColumnDef[]
  config?: ReportAdminConfig
  is_active?: boolean
}

export interface AnalyzeSqlDto {
  datasource_id: string
  sql_query: string
}

export interface AnalyzeSqlOut {
  columns: ColumnDef[]
}
