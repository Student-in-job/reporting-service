<script setup lang="ts">
import { AppLogo, AppThemeToggle } from '@/shared/ui'
</script>

<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <AppLogo class="auth-layout__brand" />
      <AppThemeToggle />
    </header>

    <main class="auth-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  background: $color-bg-body;
  @include flex-column;

  &__header {
    height: $layout-header-height;
    padding: 0 $spacing-6;
    @include flex-between;
    border-bottom: 1px solid $color-border;
  }

  &__brand {
    color: $color-text-base;
  }

  &__content {
    flex: 1;
    @include flex-center;
  }
}
</style>
