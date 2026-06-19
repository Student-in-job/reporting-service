<script setup lang="ts">
import type { ReportData } from '@/entities/report'
import { useReportBlocks } from './useReportBlocks'

interface Props {
  report: ReportData
}

const props = defineProps<Props>()

const { blocks } = useReportBlocks({ report: () => props.report })
</script>

<template>
  <ul v-if="blocks.length" class="report-blocks">
    <li
      v-for="block in blocks"
      :key="block.key"
      class="report-blocks__item"
      :style="{ '--block-color': block.color }"
    >
      <span class="report-blocks__caption">{{ block.caption }}</span>
      <span v-if="block.description" class="report-blocks__description">
        {{ block.description }}
      </span>
      <div class="report-blocks__inner">
        <span class="report-blocks__value">{{ block.value }}</span>
      </div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.report-blocks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-4;
  margin: 0;
  padding: 0;
  list-style: none;

  @include respond-to(sm) {
    grid-template-columns: 1fr;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
    padding: $spacing-4;
    background-color: $color-bg-card;
    border: 1px solid $color-border;
    border-top: 3px solid var(--block-color);
    border-radius: $radius-lg;
  }

  &__caption {
    font-size: $font-size-md;
    font-weight: $font-weight-semibold;
    color: $color-text-1;
  }

  &__description {
    font-size: $font-size-sm;
    color: $color-text-3;
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $spacing-1;
    padding: $spacing-5 $spacing-4;
    background-color: var(--block-color);
    background-image: linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12));
    border-radius: $radius-md;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
}
</style>
