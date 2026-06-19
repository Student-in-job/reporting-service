<script setup lang="ts">
import { MoonOutline, SunnyOutline } from '@vicons/ionicons5'

interface Props {
  circle?: boolean
}

withDefaults(defineProps<Props>(), { circle: true })

const { theme, toggle } = useTheme()
</script>

<template>
  <NButton
    quaternary
    :circle="circle"
    :title="theme === 'light' ? 'Тёмная тема' : 'Светлая тема'"
    @click="toggle"
  >
    <template #icon>
      <NIcon>
        <MoonOutline v-if="theme === 'light'" />
        <SunnyOutline v-else />
      </NIcon>
    </template>
  </NButton>
</template>
