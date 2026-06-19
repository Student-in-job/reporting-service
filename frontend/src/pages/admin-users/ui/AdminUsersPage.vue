<script setup lang="ts">
import { useAdminUsersPage } from './useAdminUsersPage'

const {
  usersQuery,
  columns,
  users,
  isDialogOpen,
  dialogMode,
  form,
  rules,
  roleOptions,
  isSubmitting,
  openCreate,
  onSubmit,
} = useAdminUsersPage()
</script>

<template>
  <div class="admin-users-page">
    <div class="admin-users-page__head">
      <h1 class="admin-users-page__title">Пользователи</h1>
      <NButton type="primary" @click="openCreate">Добавить</NButton>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="users"
        :loading="usersQuery.isLoading.value"
        :bordered="false"
      />

    </NCard>

    <NModal
      v-model:show="isDialogOpen"
      preset="card"
      style="max-width: 480px"
      display-directive="show"
      :auto-focus="false"
      :title="dialogMode === 'create' ? 'Новый пользователь' : 'Редактирование'"
    >
      <NForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="top"
      >
        <NFormItem label="Логин" path="username">
          <NInput
            v-model:value="form.username"
            :disabled="dialogMode === 'edit'"
            placeholder="username"
          />
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
        <NFormItem label="Роль">
          <NSelect v-model:value="form.role" :options="roleOptions" />
        </NFormItem>
        <NFormItem label="Активен">
          <NSwitch v-model:value="form.is_active" />
        </NFormItem>
      </NForm>

      <template #footer>
        <div class="admin-users-page__footer">
          <NButton @click="isDialogOpen = false">Отмена</NButton>
          <NButton
            type="primary"
            :loading="isSubmitting"
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
.admin-users-page {
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
