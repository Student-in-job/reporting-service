<script setup lang="ts">
import { useAdminReportsPage } from './useAdminReportsPage'

const {
  reportsQuery,
  reports,
  columns,
  datasourcesQuery,
  datasourceOptions,
  reportTypeOptions,
  isDialogOpen,
  dialogMode,
  isLoadingEdit,
  form,
  rules,
  isSubmitting,
  analyzedColumns,
  analyzedColumnsTableColumns,
  isAnalyzing,
  openCreate,
  onSubmit,
  onAnalyzeSql,
} = useAdminReportsPage()
</script>

<template>
  <div class="admin-reports-page">
    <div class="admin-reports-page__head">
      <h1 class="admin-reports-page__title">Отчёты</h1>
      <NButton type="primary" @click="openCreate">Добавить</NButton>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="reports"
        :loading="reportsQuery.isLoading.value"
        :bordered="false"
      />
    </NCard>

    <NModal
      v-model:show="isDialogOpen"
      preset="card"
      style="max-width: 720px"
      display-directive="show"
      :auto-focus="false"
      :title="dialogMode === 'create' ? 'Новый отчёт' : 'Редактирование отчёта'"
    >
      <NSpin :show="isLoadingEdit">
        <NForm
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="top"
        >
          <NGrid :cols="24" :x-gap="12">
            <NGridItem :span="16">
              <NFormItem label="Slug" path="slug">
                <NInput v-model:value="form.slug" placeholder="sales_daily" />
              </NFormItem>
            </NGridItem>
            <NGridItem :span="8">
              <NFormItem label="Тип" path="type">
                <NSelect v-model:value="form.type" :options="reportTypeOptions" />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <NFormItem label="Название" path="name">
            <NInput v-model:value="form.name" placeholder="Продажи по дням" />
          </NFormItem>

          <NFormItem label="Описание">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="Краткое описание отчёта"
            />
          </NFormItem>

          <NGrid :cols="24" :x-gap="12">
            <NGridItem :span="16">
              <NFormItem label="Группа">
                <NInput v-model:value="form.group" placeholder="Продажи" />
              </NFormItem>
            </NGridItem>
            <NGridItem :span="8">
              <NFormItem label="Макс. период (дней)">
                <NInputNumber
                  v-model:value="form.max_range_days"
                  :min="1"
                  placeholder="без ограничения"
                />
              </NFormItem>
            </NGridItem>
          </NGrid>

          <NFormItem label="Источник данных" path="datasource_id">
            <NSelect
              v-model:value="form.datasource_id"
              :options="datasourceOptions"
              :loading="datasourcesQuery.isLoading.value"
              filterable
              placeholder="Выберите источник"
            />
          </NFormItem>

          <NFormItem label="SQL-запрос" path="sql_query">
            <NInput
              v-model:value="form.sql_query"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 16 }"
              placeholder="SELECT ..."
              class="admin-reports-page__sql"
            />
          </NFormItem>

          <div class="admin-reports-page__analyze">
            <NButton
              secondary
              :loading="isAnalyzing"
              :disabled="!form.datasource_id || !form.sql_query.trim()"
              @click="onAnalyzeSql"
            >
              Анализировать SQL
            </NButton>
          </div>

          <div v-if="analyzedColumns.length" class="admin-reports-page__columns">
            <NDataTable
              :columns="analyzedColumnsTableColumns"
              :data="analyzedColumns"
              :bordered="false"
              size="small"
              :pagination="false"
            />
          </div>

          <NFormItem v-if="dialogMode === 'edit'" label="Активен">
            <NSwitch v-model:value="form.is_active" />
          </NFormItem>
        </NForm>
      </NSpin>

      <template #footer>
        <div class="admin-reports-page__footer">
          <NButton @click="isDialogOpen = false">Отмена</NButton>
          <NButton
            type="primary"
            :loading="isSubmitting"
            :disabled="isLoadingEdit"
            @click="onSubmit"
          >
            Сохранить
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.admin-reports-page {
  &__head {
    @include flex-between;
    margin-bottom: $spacing-4;
  }

  &__title {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
  }

  &__sql :deep(textarea) {
    font-family: $font-family-mono;
  }

  &__analyze {
    margin-bottom: $spacing-4;
  }

  &__columns {
    margin-bottom: $spacing-4;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-2;
  }
}
</style>
