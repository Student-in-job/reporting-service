<script setup lang="ts">
import VChart from 'vue-echarts'
import type { ReportData } from '@/entities/report'
import { useReportChart } from './useReportChart'
import { CHART_COLORS } from '../lib/colors'

interface Props {
  report: ReportData
}

const props = defineProps<Props>()

const { option } = useReportChart({ report: () => props.report })

const legendItems = computed(() => {
  if (props.report.type !== 'pie_chart') return []
  const labelCol = props.report.columns[0]
  return props.report.data.map((row, i) => ({
    name: String(row[labelCol.key]),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))
})
</script>

<template>
  <div class="report-chart">
    <VChart class="report-chart__canvas" :option="option" autoresize />
    <ul v-if="legendItems.length" class="report-chart__legend">
      <li
        v-for="item in legendItems"
        :key="item.name"
        class="report-chart__legend-item"
      >
        <span
          class="report-chart__legend-marker"
          :style="{ backgroundColor: item.color }"
        />
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.report-chart {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__canvas {
    width: 100%;
    height: $layout-chart-height;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  &__legend-marker {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
}
</style>
