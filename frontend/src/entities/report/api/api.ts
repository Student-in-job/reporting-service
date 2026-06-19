import type { AxiosResponse } from 'axios'
import { api, apiInstance } from '@/shared/api'
import type {
  AnalyzeSqlDto,
  AnalyzeSqlOut,
  ApiReportAdmin,
  ApiReportData,
  ApiReportsList,
  ReportCreateDto,
  ReportRunDto,
  ReportUpdateDto,
  ReportsListParams,
} from './types'

export const reportsAPI = {
  list(params?: ReportsListParams) {
    return api.get<ApiReportsList>('/reports', { params })
  },
  run(id: string, dto: ReportRunDto) {
    return api.post<ApiReportData>(`/reports/${id}/data`, dto)
  },
  export(id: string, dto: ReportRunDto) {
    return apiInstance.post<Blob, AxiosResponse<Blob>>(
      `/reports/${id}/export`,
      dto,
      { responseType: 'blob' },
    )
  },
}

export const adminReportsAPI = {
  get(id: string) {
    return api.get<ApiReportAdmin>(`/admin/reports/${id}`)
  },
  create(dto: ReportCreateDto) {
    return api.post<ApiReportAdmin>('/admin/reports', dto)
  },
  update(id: string, dto: ReportUpdateDto) {
    return api.put<ApiReportAdmin>(`/admin/reports/${id}`, dto)
  },
  remove(id: string) {
    return api.delete<void>(`/admin/reports/${id}`)
  },
  test(id: string, dto: ReportRunDto) {
    return api.post<ApiReportData>(`/admin/reports/${id}/test`, dto)
  },
  analyzeSql(dto: AnalyzeSqlDto) {
    return api.post<AnalyzeSqlOut>('/admin/reports/analyze-sql', dto)
  },
}
