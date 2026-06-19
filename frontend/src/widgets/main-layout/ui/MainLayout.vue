<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { LogOutOutline, PersonCircleOutline } from '@vicons/ionicons5'
import { AppLogo, AppThemeToggle } from '@/shared/ui'
import {
  LAYOUT_SIDEBAR_COLLAPSED_WIDTH,
  LAYOUT_SIDEBAR_WIDTH,
  MENU_COLLAPSED_ICON_SIZE,
} from '@/shared/config/ui'
import { useMainLayout } from './useMainLayout'

const {
  session,
  sidebar,
  menuOptions,
  activeKey,
  onMenuSelect,
  onLogout,
} = useMainLayout()
</script>

<template>
  <NLayout has-sider class="main-layout">
    <NLayoutSider
      bordered
      :width="LAYOUT_SIDEBAR_WIDTH"
      :collapsed-width="LAYOUT_SIDEBAR_COLLAPSED_WIDTH"
      :collapsed="sidebar.collapsed.value"
      collapse-mode="width"
      show-trigger
      :native-scrollbar="false"
      @update:collapsed="sidebar.collapsed.value = $event"
    >
      <div
        class="main-layout__brand"
        :class="{ 'main-layout__brand--collapsed': sidebar.collapsed.value }"
      >
        <AppLogo :icon-only="sidebar.collapsed.value" />
      </div>

      <NMenu
        :collapsed="sidebar.collapsed.value"
        :collapsed-width="LAYOUT_SIDEBAR_COLLAPSED_WIDTH"
        :collapsed-icon-size="MENU_COLLAPSED_ICON_SIZE"
        :options="menuOptions"
        :value="activeKey"
        @update:value="onMenuSelect"
      />
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered class="main-layout__header">
        <div class="main-layout__header-right">
          <AppThemeToggle />

          <NButton quaternary>
            <template #icon>
              <NIcon><PersonCircleOutline /></NIcon>
            </template>
            {{ session.user?.username }}
          </NButton>

          <NButton quaternary @click="onLogout">
            <template #icon>
              <NIcon><LogOutOutline /></NIcon>
            </template>
            Выйти
          </NButton>
        </div>
      </NLayoutHeader>

      <NLayoutContent class="main-layout__content">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;

  &__brand {
    height: $layout-header-height;
    display: flex;
    align-items: center;
    padding: 0 $spacing-6;
    color: $color-text-1;
    border-bottom: 1px solid $color-divider;

    &--collapsed {
      justify-content: center;
      padding: 0;
    }
  }

  &__header {
    height: $layout-header-height;
    padding: 0 $spacing-6;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__header-right {
    @include flex-align-center;
    gap: $spacing-2;
  }

  &__content {
    padding: $spacing-6;
    overflow: auto;
    height: calc(100vh - #{$layout-header-height});
  }
}
</style>
