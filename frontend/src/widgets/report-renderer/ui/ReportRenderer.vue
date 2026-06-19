<script setup lang="ts">
import { ReportChart } from '@/features/report-chart'
import { ReportTable } from '@/features/report-table'
import { ReportSummary } from '@/features/report-summary'
import { ReportBlocks } from '@/features/report-blocks'
import type { ReportData } from '@/entities/report'

interface Props {
  report: ReportData
}

const props = defineProps<Props>()

const showSummary = computed(() => props.report.slug === 'credit-app-stats')

const isBlocks = computed(() => props.report.type === 'block_chart')
const isTable = computed(() => props.report.type === 'table')
const isChart = computed(() => !isTable.value && !isBlocks.value)
</script>

<template>
  <div class="report-renderer">
    <ReportSummary v-if="showSummary" :report="report" />
    <ReportBlocks v-if="isBlocks" :report="report" />
    <ReportChart v-if="isChart" :report="report" />
    <ReportTable v-if="isTable" :report="report" />
    <details v-if="!isTable" class="report-renderer__raw">
      <summary>Показать таблицу</summary>
      <ReportTable :report="report" />
    </details>
  </div>
</template>

<style lang="scss" scoped>
.report-renderer {
  &__raw {
    margin-top: $spacing-4;

    summary {
      cursor: pointer;
      color: $color-text-3;
      margin-bottom: $spacing-2;
      user-select: none;
    }
  }
}
</style>
