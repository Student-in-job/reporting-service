<script setup lang="ts">
import type { ReportFilter } from '@/entities/report'
import { DATE_PICKER_FORMAT } from '@/shared/lib'
import type { ReportFiltersPayload } from '../model/types'
import { useReportFilterBar } from './useReportFilterBar'

interface Props {
  filters: ReportFilter[]
  loading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit', payload: ReportFiltersPayload): void
}>()

const { model, dateRange, dateShortcuts, customFilters, rules, onSubmit } = useReportFilterBar({
  filters: () => props.filters,
  emit,
})
</script>

<template>
  <NForm
    ref="formRef"
    :model="model"
    :rules="rules"
    label-placement="top"
    inline
    class="report-filter-bar"
  >
    <NFormItem label="Период" path="dateRange">
      <NDatePicker
        v-model:value="dateRange"
        type="daterange"
        :format="DATE_PICKER_FORMAT"
        clearable
        :shortcuts="dateShortcuts"
        class="report-filter-bar__range"
      />
    </NFormItem>

    <NFormItem
      v-for="f in customFilters"
      :key="f.name"
      :label="f.label"
      :path="`filters.${f.name}`"
    >
      <NDatePicker
        v-if="f.type === 'date'"
        v-model:value="(model.filters[f.name] as number | null)"
        type="date"
        :format="DATE_PICKER_FORMAT"
        clearable
      />
      <NInputNumber
        v-else-if="f.type === 'number'"
        v-model:value="(model.filters[f.name] as number | null)"
      />
      <NSwitch
        v-else-if="f.type === 'boolean'"
        v-model:value="(model.filters[f.name] as boolean)"
      />
      <NSelect
        v-else-if="f.type === 'select'"
        v-model:value="(model.filters[f.name] as string | number | null)"
        :options="(f.options ?? []).map((o) => ({ label: o.label, value: o.value }))"
        clearable
      />
      <NInput
        v-else
        v-model:value="(model.filters[f.name] as string)"
        clearable
      />
    </NFormItem>

    <NFormItem label=" " :show-feedback="false">
      <NSpace>
        <NButton type="primary" :loading="loading" @click="onSubmit">
          Применить
        </NButton>
      </NSpace>
    </NFormItem>
  </NForm>
</template>

<style lang="scss" scoped>
.report-filter-bar {
  padding: $spacing-4;
  background: $color-bg-card;
  border-radius: $radius-md;

  :deep(.n-form-item) {
    margin-bottom: 0;
  }

  &__range {
    width: calc(#{$layout-filter-input-width} * 2 + #{$spacing-2});
  }
}
</style>
