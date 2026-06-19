export class ApiError extends Error {
  status: number
  detail: string
  data?: unknown

  constructor(status: number, detail: string, data?: unknown) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.data = data
  }
}
