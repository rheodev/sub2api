<template>
  <div class="auth-shell">
    <aside class="auth-story">
      <router-link to="/home" class="auth-story-brand">
        <img v-if="settingsLoaded" :src="siteLogo || '/logo.svg'" alt="" /><span>{{ siteName }}</span>
      </router-link>
      <div class="auth-story-body">
        <h1>{{ t('workspace.authTitle') }}</h1>
        <p class="auth-story-description">{{ siteSubtitle }}</p>
        <div class="mt-12">
          <div v-for="item in storyDetails" :key="item.title" class="auth-story-detail">
            <Icon :name="item.icon" size="md" />
            <div><strong>{{ t(`workspace.${item.title}`) }}</strong><p>{{ t(`workspace.${item.description}`) }}</p></div>
          </div>
        </div>
      </div>
      <p class="auth-story-footer">&copy; {{ currentYear }} {{ siteName }}</p>
    </aside>
    <main class="auth-main">
      <div class="auth-toolbar">
        <router-link to="/home" class="auth-home"><Icon name="arrowLeft" size="sm" />{{ t('workspace.home') }}</router-link>
        <LocaleSwitcher />
      </div>
      <div class="auth-form">
        <div class="auth-mobile-brand"><img v-if="settingsLoaded" :src="siteLogo || '/logo.svg'" alt="" /><span>{{ siteName }}</span></div>
        <slot />
        <div class="auth-form-footer"><slot name="footer" /></div>
      </div>
      <p class="auth-copyright">&copy; {{ currentYear }} {{ siteName }}. All rights reserved.</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'

const storyDetails = [
  { icon: 'key', title: 'apiAccess', description: 'apiAccessDescription' },
  { icon: 'chart', title: 'usageVisibility', description: 'usageVisibilityDescription' },
  { icon: 'shield', title: 'accountSecurity', description: 'accountSecurityDescription' },
] as const

const { t } = useI18n()
const appStore = useAppStore()

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || t('workspace.authDescription'))
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  appStore.fetchPublicSettings()
})
</script>
