<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { DownloadOutline, RefreshOutline } from '@vicons/ionicons5'
import { ReportFilterBar } from '@/features/report-filters'
import { ReportRenderer } from '@/widgets/report-renderer'
import { usePage } from './usePage'

const {
  listQuery,
  meta,
  lastResult,
  runMutation,
  exportMutation,
  onSubmit,
  onRetry,
  onExport,
} = usePage()
</script>

<template>
  <div class="report-show-page">
    <div class="report-show-page__head">
      <div class="report-show-page__heading">
        <h1 v-if="meta" class="report-show-page__title">{{ meta.name }}</h1>
        <p v-if="meta?.description" class="report-show-page__desc">
          {{ meta.description }}
        </p>
      </div>

      <NSpace v-if="lastResult" size="small">
        <NButton
          secondary
          :loading="exportMutation.isPending.value"
          @click="onExport"
        >
          <template #icon>
            <NIcon><DownloadOutline /></NIcon>
          </template>
          Выгрузить XLSX
        </NButton>

        <NButton
          secondary
          :loading="runMutation.isPending.value"
          @click="onRetry"
        >
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          Перезапустить
        </NButton>
      </NSpace>
    </div>

    <NSpin :show="listQuery.isLoading.value">
      <NEmpty
        v-if="!listQuery.isLoading.value && !meta"
        description="Отчёт не найден"
      />

      <template v-else-if="meta">
        <ReportFilterBar
          :filters="meta.filters"
          :loading="runMutation.isPending.value"
          @submit="onSubmit"
        />

        <NCard
          v-if="lastResult"
          class="report-show-page__result"
          :title="lastResult.title"
        >
          <template #header-extra>
            <NSpace size="small">
              <NTag size="small" :bordered="false">
                Строк: {{ lastResult.meta.total_rows }}
              </NTag>
              <NTag size="small" :bordered="false" type="info">
                {{ lastResult.meta.execution_time_ms }} мс
              </NTag>
            </NSpace>
          </template>
          <ReportRenderer :report="lastResult" />
        </NCard>

        <NEmpty
          v-else-if="!runMutation.isPending.value && !runMutation.error.value"
          description="Задайте фильтры и нажмите «Применить»"
        />
      </template>
    </NSpin>
  </div>
</template>

<style lang="scss" scoped>
.report-show-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  :deep(.n-spin-content) {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-4;
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
  }

  &__desc {
    margin: 0;
    color: $color-text-3;
  }

}
</style>
