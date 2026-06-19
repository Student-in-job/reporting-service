import type { ReportData } from '@/entities/report'
import { formatNumber } from '@/shared/lib'
import { BLOCK_COLORS } from '../lib/colors'

export interface ReportBlock {
  key: string
  caption: string
  description: string | null
  value: string
  color: string
}

interface UseReportBlocksParams {
  report: () => ReportData
}

export function useReportBlocks(params: UseReportBlocksParams) {
  const blocks = computed<ReportBlock[]>(() => {
    const report = params.report()
    const rows = report.data
    const cols = report.columns
    if (!rows.length || !cols.length) return []

    const valueCol = cols.find((c) => c.type === 'number') ?? cols[cols.length - 1]
    const captionCol = cols.find((c) => c.type !== 'number') ?? cols[0]
    const descriptionCol = cols.find(
      (c) => c.type !== 'number' && c.key !== captionCol.key,
    )

    return rows.map((row, i) => ({
      key: String(i),
      caption: String(row[captionCol.key] ?? ''),
      description: descriptionCol ? String(row[descriptionCol.key] ?? '') : null,
      value: formatNumber(row[valueCol.key]),
      color: BLOCK_COLORS[i % BLOCK_COLORS.length],
    }))
  })

  return { blocks }
}
