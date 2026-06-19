import type { DataTableColumns, DataTableCreateSummary } from 'naive-ui'
import { formatCell, type ColumnType, type ReportData } from '@/entities/report'

interface UseReportTableParams {
  report: () => ReportData
}

const MIN_WIDTH_BY_TYPE: Record<ColumnType, number> = {
  number: 120,
  date: 140,
  datetime: 170,
  boolean: 100,
  string: 160,
}

function columnMinWidth(label: string, type: ColumnType): number {
  const labelEstimate = label.length * 9 + 40
  return Math.max(MIN_WIDTH_BY_TYPE[type], labelEstimate)
}

export function useReportTable(params: UseReportTableParams) {
  const columns = computed<DataTableColumns<Record<string, unknown>>>(() =>
    params.report().columns.map((c) => {
      const isNumeric = c.type === 'number'
      return {
        title: c.label,
        key: c.key,
        align: isNumeric ? 'right' : 'left',
        minWidth: columnMinWidth(c.label, c.type),
        ellipsis: { tooltip: true },
        render: (row) =>
          h('span', { class: isNumeric ? 'report-table__num' : '' }, formatCell(row[c.key], c.type)),
      }
    }),
  )

  const scrollX = computed(() =>
    params.report().columns.reduce((acc, c) => acc + columnMinWidth(c.label, c.type), 0),
  )

  const data = computed(() => params.report().data as Record<string, unknown>[])

  const summary = computed<DataTableCreateSummary | undefined>(() => {
    const report = params.report()
    const numericCols = report.columns.filter((c) => c.type === 'number')
    if (numericCols.length === 0 || report.data.length === 0) return undefined

    const labelCol = report.columns.find((c) => c.type !== 'number')

    return () => ({
      ...(labelCol && {
        [labelCol.key]: {
          value: h('span', { class: 'report-table__summary-label' }, 'Итого'),
        },
      }),
      ...Object.fromEntries(
        numericCols.map((c) => {
          const sum = report.data.reduce((acc, row) => acc + Number(row[c.key] ?? 0), 0)
          return [
            c.key,
            {
              value: h(
                'span',
                { class: 'report-table__num report-table__summary-value' },
                formatCell(sum, 'number'),
              ),
            },
          ]
        }),
      ),
    })
  })

  return { columns, data, summary, scrollX }
}
