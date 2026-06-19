import type { ReportType } from '@/entities/report'

export type AdminReportDialogMode = 'create' | 'edit'

export interface AdminReportFormState {
  slug: string
  name: string
  description: string
  group: string
  type: ReportType
  datasource_id: string | null
  sql_query: string
  max_range_days: number | null
  is_active: boolean
}
