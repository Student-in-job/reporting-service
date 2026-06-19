import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import type { ReportData } from '@/entities/report'
import { buildChartOption } from '../lib/buildChartOption'

use([
  CanvasRenderer,
  BarChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
])

interface UseReportChartParams {
  report: () => ReportData
}

export function useReportChart(params: UseReportChartParams) {
  const option = computed(() => buildChartOption(params.report()))
  return { option }
}
