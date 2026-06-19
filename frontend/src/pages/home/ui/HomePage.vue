<script setup lang="ts">
import { NIcon } from 'naive-ui'
import { StatsChartOutline } from '@vicons/ionicons5'
</script>

<template>
  <div class="home-page">
    <NEmpty description="Выберите отчёт в меню слева">
      <template #icon>
        <NIcon><StatsChartOutline /></NIcon>
      </template>
    </NEmpty>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  height: 100%;
  @include flex-center;
}
</style>
