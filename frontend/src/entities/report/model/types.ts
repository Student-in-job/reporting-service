export const COLUMN_TYPES = ['string', 'number', 'date', 'datetime', 'boolean'] as const
export type ColumnType = (typeof COLUMN_TYPES)[number]

export const REPORT_TYPES = [
  'table',
  'pie_chart',
  'scatter_plot',
  'bar_chart',
  'horizontal_stack',
  'vertical_stack',
  'block_chart',
] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export const FILTER_TYPES = ['date', 'string', 'number', 'boolean', 'select'] as const
export type FilterType = (typeof FILTER_TYPES)[number]

export interface FilterOption {
  value: string | number
  label: string
}

export interface ReportFilter {
  name: string
  label: string
  type: FilterType
  required?: boolean
  options?: FilterOption[]
}

export interface ColumnDef {
  key: string
  label: string
  type: ColumnType
}

export interface ReportListItem {
  id: string
  slug: string
  name: string
  description?: string | null
  group?: string | null
  type: ReportType
  filters: ReportFilter[]
}

export interface ReportData {
  report_id: string
  slug: string
  title: string
  type: ReportType
  columns: ColumnDef[]
  data: Array<Record<string, unknown>>
  totals?: Record<string, unknown> | null
  meta: ReportDataMeta
}

export interface ReportDataMeta {
  generated_at: string
  execution_time_ms: number
  total_rows: number
  filters_applied: Record<string, unknown>
  test_mode?: boolean
}

export interface ReportAdminConfig {
  filters?: ReportFilter[]
  columns?: ColumnDef[]
  max_range_days?: number
}

export interface ReportAdmin {
  id: string
  slug: string
  name: string
  description?: string | null
  group?: string | null
  type: ReportType
  datasource_id: string
  sql_query: string
  config: ReportAdminConfig
  is_active: boolean
  created_at: string
  updated_at: string
}
