<script setup lang="ts">
import { usePageHeading } from '@/composables/usePageHeading'
const { pageTitle, pageDescription } = usePageHeading()
</script>

<template>
  <div class="workspace-heading">
    <div class="min-w-0">
      <h1>{{ pageTitle }}</h1>
      <p v-if="pageDescription">{{ pageDescription }}</p>
    </div>
    <div v-if="$slots.default" class="workspace-heading-actions"><slot /></div>
  </div>
</template>
