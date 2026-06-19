<script setup lang="ts">
import { useAdminDatasourcesPage } from './useAdminDatasourcesPage'

const {
  datasourcesQuery,
  datasources,
  columns,
  isDialogOpen,
  dialogMode,
  form,
  rules,
  isSubmitting,
  openCreate,
  onSubmit,
} = useAdminDatasourcesPage()
</script>

<template>
  <div class="admin-datasources-page">
    <div class="admin-datasources-page__head">
      <h1 class="admin-datasources-page__title">Источники данных</h1>
      <NButton type="primary" @click="openCreate">Добавить</NButton>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="datasources"
        :loading="datasourcesQuery.isLoading.value"
        :bordered="false"
      />
    </NCard>

    <NModal
      v-model:show="isDialogOpen"
      preset="card"
      style="max-width: 520px"
      display-directive="show"
      :auto-focus="false"
      :title="dialogMode === 'create' ? 'Новый источник' : 'Редактирование источника'"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <NFormItem label="Название" path="name">
          <NInput v-model:value="form.name" placeholder="Production DB" />
        </NFormItem>

        <NGrid :cols="24" :x-gap="12">
          <NGridItem :span="18">
            <NFormItem label="Host" path="host">
              <NInput v-model:value="form.host" placeholder="db.example.com" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="6">
            <NFormItem label="Port" path="port">
              <NInputNumber
                v-model:value="form.port"
                :min="1"
                :max="65535"
                :show-button="false"
              />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <NFormItem label="База данных" path="database">
          <NInput v-model:value="form.database" placeholder="finsolve" />
        </NFormItem>

        <NFormItem label="Логин" path="username">
          <NInput v-model:value="form.username" placeholder="readonly_user" />
        </NFormItem>

        <NFormItem
          :label="dialogMode === 'create' ? 'Пароль' : 'Новый пароль (опционально)'"
          path="password"
        >
          <NInput
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="••••••"
          />
        </NFormItem>

        <NFormItem label="Активен">
          <NSwitch v-model:value="form.is_active" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="admin-datasources-page__footer">
          <NButton @click="isDialogOpen = false">Отмена</NButton>
          <NButton type="primary" :loading="isSubmitting" @click="onSubmit">
            Сохранить
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.admin-datasources-page {
  &__head {
    @include flex-between;
    margin-bottom: $spacing-4;
  }

  &__title {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-2;
  }
}
</style>
