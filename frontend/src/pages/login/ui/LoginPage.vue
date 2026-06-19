<script setup lang="ts">
import { usePage } from './usePage'

const { session, formRef, model, rules, onSubmit } = usePage()
</script>

<template>
  <div class="login-page">
    <NCard class="login-page__card" title="Paystep">
      <template #header-extra>
        <span class="login-page__subtitle">Вход в систему</span>
      </template>

      <NForm
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="top"
        @submit="onSubmit"
      >
        <NFormItem label="Логин" path="username">
          <NInput v-model:value="model.username" placeholder="admin" autofocus />
        </NFormItem>
        <NFormItem label="Пароль" path="password">
          <NInput
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            placeholder="••••••"
          />
        </NFormItem>
        <NButton
          type="primary"
          attr-type="submit"
          block
          :loading="session.loading"
          @click="onSubmit"
        >
          Войти
        </NButton>
      </NForm>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  padding: $spacing-4;
  @include flex-center;

  &__card {
    width: 100%;
    max-width: $layout-login-card-width;
    box-shadow: $shadow-lg;
  }

  &__subtitle {
    color: $color-text-3;
    font-size: $font-size-sm;
  }
}
</style>
