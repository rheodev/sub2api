<template>
  <div v-if="hasHomeContent" class="min-h-screen">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" :title="siteName" class="h-screen w-full border-0" allowfullscreen></iframe>
    <div v-else v-html="homeContent"></div>
  </div>
  <div v-else class="landing" :class="{ 'is-compact': compactHomeEnabled }" :data-testid="compactHomeEnabled ? 'compact-home' : undefined">
    <header>
      <nav class="landing-nav">
        <router-link to="/home" class="landing-brand"><img :src="siteLogo || '/logo.svg'" alt="" /><span>{{ siteName }}</span></router-link>
        <div class="landing-actions">
          <LocaleSwitcher />
          <button type="button" class="btn btn-ghost btn-icon" @click="toggleTheme" :title="isDark ? t('home.switchToLight') : t('home.switchToDark')" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"><Icon :name="isDark ? 'sun' : 'moon'" size="sm" /></button>
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="btn btn-ghost hidden sm:inline-flex">{{ t('home.docs') }}</a>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="btn btn-ghost" :title="t('nav.modelPlaza')"><Icon name="grid" size="sm" /><span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span></router-link>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="btn btn-secondary">{{ isAuthenticated ? t('home.dashboard') : t('home.login') }}</router-link>
        </div>
      </nav>
    </header>
    <main>
      <div class="landing-hero">
        <div>
          <h1>{{ siteName }}</h1>
          <p>{{ siteSubtitle }}</p>
          <div class="landing-hero-links">
            <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="btn btn-primary px-6">{{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}<Icon name="arrowRight" size="sm" /></router-link>
            <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">{{ t('home.viewDocs') }}</a>
          </div>
        </div>
        <div v-if="!compactHomeEnabled" class="landing-protocol">
          <div class="landing-protocol-heading"><span>{{ t('workspace.requestExample') }}</span><code>POST /v1/messages</code></div>
          <pre><code>{{ requestExample }}</code></pre>
          <div class="landing-protocol-label">{{ t('workspace.requestExampleNote') }}</div>
        </div>
      </div>
      <template v-if="!compactHomeEnabled">
        <section class="landing-details">
          <div class="landing-detail-list">
            <article v-for="feature in ['unifiedGateway', 'multiAccount', 'balanceQuota']" :key="feature" class="landing-detail">
              <h2>{{ t(`home.features.${feature}`) }}</h2><p>{{ t(`home.features.${feature}Desc`) }}</p>
            </article>
          </div>
        </section>
        <section class="landing-providers">
          <h2>{{ t('home.providers.title') }}</h2><p>{{ t('home.providers.description') }}</p>
          <div class="landing-provider-list">
            <div class="landing-provider"><span>{{ t('home.providers.claude') }}</span><small>{{ t('home.providers.supported') }}</small></div>
            <div class="landing-provider"><span>GPT</span><small>{{ t('home.providers.supported') }}</small></div>
            <div class="landing-provider"><span>Gemini</span><small>{{ t('home.providers.supported') }}</small></div>
            <div class="landing-provider"><span>Antigravity</span><small>{{ t('home.providers.supported') }}</small></div>
            <div class="landing-provider"><span>{{ t('home.providers.more') }}</span><small>{{ t('home.providers.soon') }}</small></div>
          </div>
        </section>
      </template>
    </main>
    <footer class="landing-footer"><div>
      <p>&copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
      <nav><a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}</a><a :href="githubUrl" target="_blank" rel="noopener noreferrer">GitHub</a></nav>
    </div></footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'AI API Gateway Platform')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelPlazaRequiresAuth = computed(
  () => appStore.cachedPublicSettings?.model_plaza_require_auth === true,
)
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || !modelPlazaRequiresAuth.value),
)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const requestExample = `curl https://api.example.com/v1/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "YOUR_MODEL",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'`

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>
