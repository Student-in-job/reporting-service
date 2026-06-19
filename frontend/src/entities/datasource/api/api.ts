import { api } from '@/shared/api'
import type {
  ApiDatasource,
  ApiDatasourcesList,
  DatasourceCreateDto,
  DatasourceTestOut,
  DatasourceUpdateDto,
} from './types'

export const datasourcesAPI = {
  list() {
    return api.get<ApiDatasourcesList>('/admin/datasources')
  },
  create(dto: DatasourceCreateDto) {
    return api.post<ApiDatasource>('/admin/datasources', dto)
  },
  update(id: string, dto: DatasourceUpdateDto) {
    return api.put<ApiDatasource>(`/admin/datasources/${id}`, dto)
  },
  remove(id: string) {
    return api.delete<void>(`/admin/datasources/${id}`)
  },
  test(id: string) {
    return api.post<DatasourceTestOut>(`/admin/datasources/${id}/test`)
  },
}
