<script setup lang="ts">
import { setErrorToastHandler } from '@/shared/api'

const message = useMessage()

onMounted(() => {
  setErrorToastHandler((text) => {
    message.error(text, { duration: 5000, closable: true })
  })
})
</script>

<template>
  <span style="display: none" />
</template>
