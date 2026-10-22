<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTableDensity } from '@/composables/useTableDensity'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const { density, toggleDensity } = useTableDensity()
const label = computed(() => t(density.value === 'compact' ? 'workspace.standardDensity' : 'workspace.compactDensity'))
</script>

<template>
  <button type="button" class="workspace-density" :aria-label="label" :title="label"
    :aria-pressed="density === 'compact'" @click="toggleDensity">
    <Icon name="menu" size="sm" />
    <span>{{ t(density === 'compact' ? 'workspace.compact' : 'workspace.standard') }}</span>
  </button>
</template>
