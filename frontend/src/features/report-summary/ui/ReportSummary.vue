<script setup lang="ts">
import type { ReportData } from '@/entities/report'
import { formatNumber } from '@/shared/lib'
import { useReportSummary } from './useReportSummary'

interface Props {
  report: ReportData
}

const props = defineProps<Props>()

const { stats } = useReportSummary({ report: () => props.report })
</script>

<template>
  <ul v-if="stats.length" class="report-summary">
    <li v-for="stat in stats" :key="stat.key" class="report-summary__item">
      <span class="report-summary__label">{{ stat.label }}</span>
      <span class="report-summary__value">{{ formatNumber(stat.average) }}</span>
      <span class="report-summary__hint">в среднем за день</span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.report-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: $spacing-3;
  margin: 0 0 $spacing-4;
  padding: 0;
  list-style: none;

  &__item {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    padding: $spacing-3;
    border: 1px solid $color-border;
    border-radius: 8px;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-3;
  }

  &__value {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
  }

  &__hint {
    font-size: 12px;
    color: $color-text-3;
  }
}
</style>
