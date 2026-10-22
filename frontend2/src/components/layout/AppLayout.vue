<template>
  <div class="workspace-shell">
    <a class="skip-link" href="#workspace-main">{{ t('workspace.skipToContent') }}</a>
    <AppSidebar />
    <div class="workspace-body" :class="{ 'workspace-body-collapsed': sidebarCollapsed }">
      <AppHeader />
      <main id="workspace-main" class="workspace-main" tabindex="-1">
        <PageHeading><TableDensityControl /></PageHeading>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/styles/onboarding.css'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHeading from './PageHeading.vue'
import TableDensityControl from './TableDensityControl.vue'
import { useAppStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useOnboardingStore } from '@/stores/onboarding'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isAdmin = computed(() => authStore.user?.role === 'admin')

const { replayTour } = useOnboardingTour({
  storageKey: isAdmin.value ? 'admin_guide' : 'user_guide',
  autoStart: true
})

const onboardingStore = useOnboardingStore()

onMounted(() => {
  onboardingStore.setReplayCallback(replayTour)
})

defineExpose({ replayTour })
</script>
