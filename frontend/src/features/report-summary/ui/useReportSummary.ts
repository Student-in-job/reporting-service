import type { ReportData } from '@/entities/report'

export interface SummaryStat {
  key: string
  label: string
  average: number
}

interface UseReportSummaryParams {
  report: () => ReportData
}

export function useReportSummary(params: UseReportSummaryParams) {
  const stats = computed<SummaryStat[]>(() => {
    const report = params.report()
    const rows = report.data
    if (!rows.length) return []

    const numberCols = report.columns.slice(1).filter((c) => c.type === 'number')

    return numberCols.map((col) => {
      const sum = rows.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0)
      return {
        key: col.key,
        label: col.label,
        average: Math.round(sum / rows.length),
      }
    })
  })

  return { stats }
}
