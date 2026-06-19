export type AdminDatasourceDialogMode = 'create' | 'edit'

export interface AdminDatasourceFormState {
  name: string
  host: string
  port: number
  database: string
  username: string
  password: string
  is_active: boolean
}
