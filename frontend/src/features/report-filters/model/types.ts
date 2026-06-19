export interface ReportFiltersPayload {
  date_from: string
  date_to: string
  filters: Record<string, unknown>
}

export interface ReportFiltersModel {
  date_from: number | null
  date_to: number | null
  filters: Record<string, unknown>
}
