<script setup lang="ts">
import { darkTheme, dateRuRU, ruRU } from 'naive-ui'
import { getThemeOverrides } from '@/app/providers/theme'
import ErrorToastBridge from '@/app/providers/ErrorToastBridge.vue'

const { theme } = useTheme()
const naiveTheme = computed(() => (theme.value === 'dark' ? darkTheme : null))
const themeOverrides = computed(() => getThemeOverrides(theme.value))

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})
</script>

<template>
  <NConfigProvider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :locale="ruRU"
    :date-locale="dateRuRU"
  >
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <ErrorToastBridge />
            <RouterView />
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
