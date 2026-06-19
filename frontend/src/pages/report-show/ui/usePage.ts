import { useMutation, useQuery } from '@tanstack/vue-query'
import type { ReportFiltersPayload } from '@/features/report-filters'
import {
  reportsAPI,
  type ApiReportData,
  type ApiReportListItem,
} from '@/entities/report'

function getExportFilename(header: string | null | undefined, fallback: string) {
  if (!header) return fallback

  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = header.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i)
  const filename = plainMatch?.[1] ?? plainMatch?.[2]
  return filename?.trim() || fallback
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function usePage() {
  const route = useRoute()
  const message = useMessage()

  const reportId = computed(() => route.params.id as string)

  const listQuery = useQuery({
    queryKey: ['reports-menu'],
    queryFn: () => reportsAPI.list(),
  })

  const meta = computed<ApiReportListItem | undefined>(() =>
    listQuery.data.value?.reports.find(
      (r) => r.slug === reportId.value || r.id === reportId.value,
    ),
  )

  const lastResult = ref<ApiReportData | null>(null)
  const lastPayload = ref<ReportFiltersPayload | null>(null)

  const runMutation = useMutation({
    mutationFn: (payload: ReportFiltersPayload) =>
      reportsAPI.run(reportId.value, payload),
    onSuccess: (data) => {
      lastResult.value = data
    },
  })

  const exportMutation = useMutation({
    mutationFn: (payload: ReportFiltersPayload) =>
      reportsAPI.export(reportId.value, payload),
    onSuccess: (response) => {
      const fallback = `${meta.value?.slug ?? reportId.value}.xlsx`
      const filename = getExportFilename(
        response.headers['content-disposition'],
        fallback,
      )
      downloadBlob(response.data, filename)
      message.success('Файл выгружен')
    },
  })

  watch(reportId, () => {
    lastResult.value = null
    lastPayload.value = null
    runMutation.reset()
    exportMutation.reset()
  })

  function onSubmit(payload: ReportFiltersPayload) {
    lastPayload.value = payload
    runMutation.mutate(payload)
  }

  function onRetry() {
    if (lastPayload.value) runMutation.mutate(lastPayload.value)
  }

  function onExport() {
    if (!lastPayload.value) return
    exportMutation.mutate(lastPayload.value)
  }

  return {
    listQuery,
    meta,
    lastResult,
    runMutation,
    exportMutation,
    onSubmit,
    onRetry,
    onExport,
  }
}
