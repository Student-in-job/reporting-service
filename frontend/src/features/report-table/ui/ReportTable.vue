<script setup lang="ts">
import type { ReportData } from '@/entities/report'
import { TABLE_DEFAULT_PAGE_SIZE } from '@/shared/config/ui'
import { useReportTable } from './useReportTable'

interface Props {
  report: ReportData
}

const props = defineProps<Props>()

const { columns, data, summary, scrollX } = useReportTable({ report: () => props.report })
</script>

<template>
  <NDataTable
    class="report-table"
    :columns="columns"
    :data="data"
    :summary="summary"
    :pagination="{ pageSize: TABLE_DEFAULT_PAGE_SIZE }"
    :scroll-x="scrollX"
    :bordered="false"
  />
</template>

<style lang="scss" scoped>
.report-table {
  :deep(.n-data-table-th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__num {
    font-variant-numeric: tabular-nums;
    font-family: $font-family-mono;
  }

  &__summary-label,
  &__summary-value {
    font-weight: $font-weight-semibold;
  }

  :deep(.n-data-table-tr--summary) {
    .n-data-table-td--summary {
      background-color: var(--n-th-color);
      font-weight: $font-weight-semibold;
      border-top: 1px solid var(--n-merged-border-color);
      position: sticky;
      bottom: 0;
      z-index: 1;
    }
  }
}
</style>
