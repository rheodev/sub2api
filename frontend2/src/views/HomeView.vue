<template>
  <div v-if="hasHomeContent" class="min-h-screen">
    <iframe v-if="isHomeContentUrl" :src="homeContent.trim()" :title="siteName" class="h-screen w-full border-0" allowfullscreen></iframe>
    <div v-else v-html="homeContent"></div>
  </div>
  <div v-else class="landing welcome" :class="{ 'is-compact': compactHomeEnabled }" :data-testid="compactHomeEnabled ? 'compact-home' : undefined">
    <a href="#home-main" class="skip-link">{{ t('workspace.skipToContent') }}</a>
    <header class="welcome-header">
      <nav class="welcome-nav" :aria-label="t('portal.navigation')">
        <router-link to="/home" class="welcome-brand">
          <img v-if="siteLogo" :src="siteLogo" alt="" />
          <span v-else class="welcome-brand-mark" aria-hidden="true"><Icon name="sparkles" size="md" /></span>
          <span>{{ siteName }}</span>
        </router-link>
        <div class="welcome-nav-actions">
          <a v-if="!compactHomeEnabled" href="#inspiration" class="welcome-nav-link">{{ t('portal.scenarios') }}</a>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="welcome-nav-link">{{ t('portal.exploreModels') }}</router-link>
          <LocaleSwitcher />
          <button type="button" class="welcome-theme" @click="toggleTheme" :title="isDark ? t('home.switchToLight') : t('home.switchToDark')" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')"><Icon :name="isDark ? 'sun' : 'moon'" size="sm" /></button>
          <router-link :to="entryPath" class="btn btn-secondary welcome-login">{{ isAuthenticated ? t('portal.mySpace') : t('home.login') }}</router-link>
        </div>
      </nav>
    </header>
    <main id="home-main" tabindex="-1">
      <section class="landing-hero">
        <div class="welcome-intro">
          <p v-if="!compactHomeEnabled" class="welcome-intro-note"><span aria-hidden="true"></span>{{ t('portal.introNote') }}</p>
          <h1>{{ compactHomeEnabled ? siteName : t('portal.headline') }}</h1>
          <p class="welcome-description">{{ siteSubtitle || t('portal.description') }}</p>
          <div class="landing-hero-links">
            <router-link :to="entryPath" class="btn btn-primary welcome-primary">{{ isAuthenticated ? t('portal.mySpace') : t('portal.getStarted') }}</router-link>
            <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="welcome-text-link">{{ t('portal.exploreModels') }}<Icon name="chevronRight" size="sm" /></router-link>
            <a v-else-if="!compactHomeEnabled" href="#inspiration" class="welcome-text-link">{{ t('portal.findInspiration') }}<Icon name="chevronDown" size="sm" /></a>
            <a v-else-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="welcome-text-link">{{ t('portal.help') }}</a>
          </div>
          <div v-if="!compactHomeEnabled" class="welcome-topics" :aria-label="t('portal.scenarios')"><span v-for="item in scenarios" :key="item.key">{{ t(`portal.${item.key}Short`) }}</span></div>
        </div>
        <div v-if="!compactHomeEnabled" class="welcome-studio">
          <div class="welcome-studio-orbit" aria-hidden="true"></div>
          <span class="welcome-studio-spark" aria-hidden="true"><Icon name="sparkles" size="xl" /></span>
          <div class="welcome-studio-caption">{{ t('portal.smallIdea') }}</div>
          <div class="welcome-paper">
            <div class="welcome-paper-heading"><Icon :name="activeScenario.icon" size="sm" /><span>{{ t(`portal.${scenario}Short`) }}</span><span class="welcome-sample-label">{{ t('portal.example') }}</span></div>
            <div :id="`scenario-panel-${scenario}`" role="tabpanel" :aria-labelledby="`scenario-tab-${scenario}`" class="welcome-scenario-content">
              <h2>{{ t(`portal.${scenario}Prompt`) }}</h2>
              <p>{{ t(`portal.${scenario}Idea`) }}</p>
              <ul><li v-for="line in [1, 2, 3]" :key="line"><span aria-hidden="true"></span>{{ t(`portal.${scenario}Point${line}`) }}</li></ul>
            </div>
            <p class="welcome-paper-footnote">{{ t('portal.exampleNote') }}</p>
          </div>
          <div class="welcome-scenario-tabs" role="tablist" :aria-label="t('portal.scenarios')">
            <button v-for="item in scenarios" :id="`scenario-tab-${item.key}`" :key="item.key" type="button" role="tab" :aria-selected="scenario === item.key" :aria-controls="`scenario-panel-${item.key}`" :tabindex="scenario === item.key ? 0 : -1" @click="scenario = item.key" @keydown="onScenarioKeydown($event, item.key)"><Icon :name="item.icon" size="sm" />{{ t(`portal.${item.key}Short`) }}</button>
          </div>
        </div>
      </section>
      <template v-if="!compactHomeEnabled">
        <section id="inspiration" class="welcome-inspiration" aria-labelledby="inspiration-title">
          <div class="welcome-section-heading"><p>{{ t('portal.possibilities') }}</p><h2 id="inspiration-title">{{ t('portal.scenariosTitle') }}</h2><span>{{ t('portal.scenariosDescription') }}</span></div>
          <div class="welcome-scenario-grid">
            <article v-for="item in scenarios" :key="item.key" :class="`welcome-scenario-${item.key}`">
              <div class="welcome-scenario-icon"><Icon :name="item.icon" size="md" /></div>
              <h3>{{ t(`portal.${item.key}Title`) }}</h3><p>{{ t(`portal.${item.key}Description`) }}</p>
              <div class="welcome-example">{{ t(`portal.${item.key}Prompt`) }}</div>
              <router-link :to="entryPath" class="welcome-text-link">{{ t('portal.startExploring') }}<Icon name="chevronRight" size="sm" /></router-link>
            </article>
          </div>
        </section>
        <section v-if="showModelPlazaEntry" class="welcome-models" aria-labelledby="models-title">
          <div class="welcome-model-intro"><Icon name="grid" size="lg" /><h2 id="models-title">{{ t('portal.modelsTitle') }}</h2><p>{{ t('portal.modelsDescription') }}</p><router-link to="/model-plaza" class="welcome-text-link">{{ t('portal.viewModels') }}<Icon name="chevronRight" size="sm" /></router-link></div>
          <div class="welcome-model-list">
            <p v-if="modelsLoading" role="status">{{ t('portal.modelsLoading') }}</p>
            <div v-else-if="modelsFailed" class="welcome-model-status" role="status"><p>{{ t('portal.modelsFailed') }}</p><button type="button" class="welcome-text-link" @click="modelReload++">{{ t('portal.retry') }}</button></div>
            <template v-else-if="modelNames.length"><router-link v-for="name in modelNames" :key="name" to="/model-plaza" class="welcome-model-row"><span class="welcome-model-symbol" aria-hidden="true"><Icon name="sparkles" size="sm" /></span><span>{{ name }}</span><Icon name="chevronRight" size="sm" /></router-link></template>
            <p v-else class="welcome-model-status">{{ t('portal.modelsEmpty') }}</p>
          </div>
        </section>
        <section id="personal-services" class="welcome-services" aria-labelledby="services-title">
          <div class="welcome-section-heading"><p>{{ t('portal.yourSpace') }}</p><h2 id="services-title">{{ t('portal.servicesTitle') }}</h2><span>{{ t('portal.servicesDescription') }}</span></div>
          <div class="welcome-service-grid">
            <router-link v-for="item in services" :key="item.key" :to="isAuthenticated ? item.path : '/login'" class="welcome-service"><Icon :name="item.icon" size="md" /><h3>{{ t(`portal.${item.key}Title`) }}</h3><p>{{ t(`portal.${item.key}Description`) }}</p><span>{{ t(`portal.${item.key}Action`) }}<Icon name="chevronRight" size="sm" /></span></router-link>
          </div>
        </section>
        <section class="welcome-bottom"><Icon name="sparkles" size="lg" /><h2>{{ t('portal.readyTitle') }}</h2><p>{{ t('portal.readyDescription') }}</p><router-link :to="entryPath" class="btn btn-primary welcome-primary">{{ isAuthenticated ? t('portal.mySpace') : t('portal.getStarted') }}</router-link></section>
      </template>
    </main>
    <footer class="welcome-footer"><div><span>{{ siteName }}</span><p>&copy; {{ currentYear }} {{ siteName }}</p><nav :aria-label="t('portal.resources')"><a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">{{ t('portal.help') }}</a><router-link v-if="showModelPlazaEntry" to="/model-plaza">{{ t('portal.exploreModels') }}</router-link><router-link :to="entryPath">{{ t('portal.mySpace') }}</router-link></nav></div></footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'
import { getModelPlaza } from '@/api/modelPlaza'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const rawSiteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || '')
const siteName = computed(() => !rawSiteName.value || /^sub2api$/i.test(rawSiteName.value.trim()) ? t('portal.defaultName') : rawSiteName.value)
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => {
  const text = appStore.cachedPublicSettings?.site_subtitle?.trim() || ''
  return ['Subscription to API Conversion Platform', 'AI API Gateway Platform'].includes(text) ? '' : text
})
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const isHomeContentUrl = computed(() => /^https?:\/\//.test(homeContent.value.trim()))
const isAuthenticated = computed(() => authStore.isAuthenticated)
const entryPath = computed(() => isAuthenticated.value ? (authStore.isAdmin ? '/admin/dashboard' : '/dashboard') : '/login')
const showModelPlazaEntry = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza) && (isAuthenticated.value || appStore.cachedPublicSettings?.model_plaza_require_auth !== true))
const scenarios = [{ key: 'writing', icon: 'edit' }, { key: 'coding', icon: 'terminal' }, { key: 'learning', icon: 'book' }] as const
type Scenario = typeof scenarios[number]['key']
const scenario = ref<Scenario>('writing')
const activeScenario = computed(() => scenarios.find(item => item.key === scenario.value) || scenarios[0])
const services = computed(() => [
  { key: 'keys', icon: 'key' as const, path: '/keys' },
  { key: 'balance', icon: 'creditCard' as const, path: '/dashboard' },
  { key: 'usage', icon: 'chart' as const, path: '/usage' },
  ...(isFeatureFlagEnabled(FeatureFlags.subscription) ? [{ key: 'subscription', icon: 'grid' as const, path: '/subscriptions' }] : []),
])

async function onScenarioKeydown(event: KeyboardEvent, value: Scenario) {
  const index = scenarios.findIndex(item => item.key === value)
  let target: number
  if (event.key === 'ArrowRight') target = (index + 1) % scenarios.length
  else if (event.key === 'ArrowLeft') target = (index + scenarios.length - 1) % scenarios.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = scenarios.length - 1
  else return
  event.preventDefault()
  scenario.value = scenarios[target].key
  await nextTick()
  document.getElementById(`scenario-tab-${scenario.value}`)?.focus()
}

const modelNames = ref<string[]>([])
const modelsLoading = ref(false)
const modelsFailed = ref(false)
const modelReload = ref(0)
watch([showModelPlazaEntry, compactHomeEnabled, hasHomeContent, modelReload], async ([visible, compact, custom], _, onCleanup) => {
  modelNames.value = []
  modelsFailed.value = false
  modelsLoading.value = false
  if (!visible || compact || custom) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  modelsLoading.value = true
  try {
    const response = await getModelPlaza({ signal: controller.signal })
    if (!controller.signal.aborted) modelNames.value = [...new Set((response.groups || []).flatMap(group => (group.models || []).map(model => model.name)).filter(Boolean))].slice(0, 4)
  } catch {
    if (!controller.signal.aborted) modelsFailed.value = true
  } finally {
    if (!controller.signal.aborted) modelsLoading.value = false
  }
}, { immediate: true })

const isDark = ref(document.documentElement.classList.contains('dark'))
const currentYear = computed(() => new Date().getFullYear())
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) void appStore.fetchPublicSettings()
})
</script>

<style scoped>
.welcome { --home-ink: #203b48; --home-soft: #edf5f4; --home-accent: #28756d; min-height: 100vh; display: flex; flex-direction: column; color: var(--ws-text); background: var(--ws-surface); }
.dark .welcome { --home-ink: #e4f0f1; --home-soft: #1d3034; --home-accent: #8bcdc2; }
.welcome main { flex: 1; }
.welcome > .skip-link:not(:focus) { clip-path: inset(50%); }
.welcome main:focus { outline: none; }
.welcome-header { border-bottom: 1px solid var(--ws-border); }
.welcome-nav { max-width: 1240px; margin: auto; padding: 22px 32px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
.welcome-brand { display: flex; align-items: center; gap: 10px; min-width: 0; max-width: 300px; color: var(--home-ink); font-size: 19px; font-weight: 650; }
.welcome-brand > span:last-child { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.welcome-brand img { height: 32px; width: 32px; flex-shrink: 0; object-fit: contain; }
.welcome-brand-mark { width: 34px; height: 34px; border-radius: 12px; background: var(--home-soft); display: grid; place-items: center; color: var(--home-accent); flex-shrink: 0; }
.welcome-nav-actions { display: flex; align-items: center; gap: 22px; flex-shrink: 0; }
.welcome-nav-link { color: var(--ws-muted); font-size: 13px; }
.welcome-nav-link:hover, .welcome-footer a:hover { color: var(--ws-action); }
.welcome-theme { width: 36px; height: 36px; border-radius: 6px; display: grid; place-items: center; color: var(--ws-muted); }
.welcome-theme:hover { background: var(--ws-inset); }
.landing-hero { max-width: 1240px; width: 100%; margin: auto; padding: 72px 32px 80px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 64px; align-items: center; }
.welcome-intro-note { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; color: var(--home-accent); font-size: 13px; }
.welcome-intro-note span { width: 20px; height: 1px; background: currentColor; }
.welcome h1 { max-width: 10em; white-space: pre-line; font-size: clamp(38px, 4.2vw, 58px); line-height: 1.25; font-weight: 600; letter-spacing: -0.045em; color: var(--home-ink); overflow-wrap: anywhere; }
.welcome-description { max-width: 35em; margin-top: 24px; color: var(--ws-muted); font-size: 16px; line-height: 1.9; white-space: pre-wrap; overflow-wrap: anywhere; }
.landing-hero-links { display: flex; align-items: center; flex-wrap: wrap; gap: 24px; margin-top: 32px; }
.welcome .welcome-primary { min-height: 46px; padding: 11px 25px; border-radius: 8px; }
.welcome-text-link { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; font-size: 13px; font-weight: 500; color: var(--ws-action); }
.welcome-text-link:hover { text-decoration: underline; }
.welcome-topics { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 36px; color: var(--ws-muted); font-size: 12px; }
.welcome-topics span + span { border-left: 1px solid var(--ws-border); padding-left: 18px; }
.welcome-studio { position: relative; min-width: 0; overflow: hidden; border-radius: 120px 24px 24px 24px; background: var(--home-soft); padding: 38px 28px 24px; }
.welcome-studio-orbit { position: absolute; width: 300px; height: 300px; border: 1px solid rgb(40 117 109 / 0.15); border-radius: 50%; right: -100px; top: -120px; pointer-events: none; }
.welcome-studio-orbit::after { content: ''; position: absolute; inset: 22px; border: 1px solid rgb(40 117 109 / 0.12); border-radius: 50%; }
.welcome-studio-spark { position: absolute; top: 22px; right: 24px; color: var(--home-accent); transform: rotate(12deg); }
.welcome-studio-caption { position: relative; padding: 0 34px 22px 18px; color: var(--home-accent); font-size: 13px; }
.welcome-paper { position: relative; min-height: 304px; border: 1px solid var(--ws-border); border-radius: 12px; padding: 24px; background: var(--ws-surface); box-shadow: 0 10px 25px rgb(32 59 72 / 0.04); }
.welcome-paper-heading { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; color: var(--home-accent); font-size: 12px; }
.welcome-sample-label { margin-left: auto; color: var(--ws-muted); font-size: 11px; }
.welcome-scenario-content h2 { color: var(--home-ink); font-size: 22px; line-height: 1.5; font-weight: 550; letter-spacing: -0.02em; }
.welcome-scenario-content > p { margin-top: 12px; font-size: 12px; line-height: 1.8; color: var(--ws-muted); }
.welcome-scenario-content ul { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }
.welcome-scenario-content li { display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--ws-muted); }
.welcome-scenario-content li > span { width: 5px; height: 5px; background: var(--home-accent); opacity: 0.55; border-radius: 50%; flex-shrink: 0; }
.welcome-paper-footnote { margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--ws-border); color: var(--ws-muted); font-size: 10px; }
.welcome-scenario-tabs { position: relative; display: flex; justify-content: center; gap: 4px; margin-top: 20px; }
.welcome-scenario-tabs button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border: 1px solid transparent; border-radius: 8px; font-size: 12px; color: var(--ws-muted); }
.welcome-scenario-tabs button[aria-selected=true] { border-color: var(--ws-border); background: var(--ws-surface); color: var(--home-accent); }
.welcome-inspiration, .welcome-services { width: 100%; max-width: 1240px; margin: auto; padding: 60px 32px; scroll-margin-top: 24px; }
.welcome-inspiration { border-top: 1px solid var(--ws-border); }
.welcome-section-heading > p { margin-bottom: 12px; color: var(--home-accent); font-size: 12px; }
.welcome-section-heading h2, .welcome-model-intro h2, .welcome-bottom h2 { color: var(--home-ink); font-size: 30px; line-height: 1.4; font-weight: 550; letter-spacing: -0.03em; }
.welcome-section-heading > span { display: block; margin-top: 14px; color: var(--ws-muted); font-size: 14px; line-height: 1.8; }
.welcome-scenario-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; margin-top: 32px; }
.welcome-scenario-grid article { min-width: 0; padding: 26px; border-radius: 16px; background: var(--ws-canvas); }
.welcome-scenario-icon { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; margin-bottom: 20px; color: var(--home-accent); background: var(--ws-surface); border-radius: 10px; }
.welcome-scenario-grid h3 { font-size: 19px; font-weight: 550; color: var(--home-ink); }
.welcome-scenario-grid article > p { min-height: 72px; margin-top: 12px; color: var(--ws-muted); font-size: 13px; line-height: 1.9; }
.welcome-example { margin: 20px 0 12px; border-left: 2px solid var(--ws-border); padding-left: 12px; font-size: 13px; line-height: 1.8; color: var(--home-ink); }
.welcome-models { max-width: 1176px; margin: 8px auto; padding: 36px 40px; background: var(--home-soft); border-radius: 18px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 64px; }
.welcome-model-intro > svg { color: var(--home-accent); margin-bottom: 20px; }
.welcome-model-intro p { color: var(--ws-muted); font-size: 13px; line-height: 1.9; margin-top: 16px; }
.welcome-model-intro > a { margin-top: 14px; }
.welcome-model-list { min-width: 0; }
.welcome-model-row { display: flex; align-items: center; gap: 12px; padding: 15px 0; border-bottom: 1px solid var(--ws-border); }
.welcome-model-row:last-child { border-bottom: 0; }
.welcome-model-row > span:nth-child(2) { min-width: 0; flex: 1; font-size: 14px; overflow-wrap: anywhere; }
.welcome-model-row > svg { flex-shrink: 0; color: var(--ws-muted); }
.welcome-model-symbol { display: grid; place-items: center; color: var(--home-accent); width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; background: var(--ws-surface); }
.welcome-model-status, .welcome-model-list > p { font-size: 13px; line-height: 1.9; color: var(--ws-muted); padding: 24px; border: 1px dashed var(--ws-border); border-radius: 12px; }
.welcome-service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 28px; margin-top: 36px; }
.welcome-service { display: block; padding: 0 20px 0 0; }
.welcome-service > svg { color: var(--home-accent); margin-bottom: 20px; }
.welcome-service h3 { color: var(--home-ink); font-size: 17px; font-weight: 550; }
.welcome-service p { margin: 12px 0; color: var(--ws-muted); font-size: 13px; line-height: 1.9; }
.welcome-service > span { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; font-size: 12px; color: var(--ws-action); }
.welcome-service:hover > span { text-decoration: underline; }
.welcome-bottom { max-width: 1176px; margin: 12px auto 64px; padding: 48px 24px; background: var(--home-soft); border-radius: 18px; text-align: center; }
.welcome-bottom > svg { margin: 0 auto 20px; color: var(--home-accent); }
.welcome-bottom p { color: var(--ws-muted); margin: 14px auto 24px; font-size: 14px; line-height: 1.8; max-width: 40em; }
.welcome-footer { border-top: 1px solid var(--ws-border); }
.welcome-footer > div { max-width: 1240px; margin: auto; display: flex; align-items: center; flex-wrap: wrap; gap: 24px; padding: 26px 32px; }
.welcome-footer > div > span { color: var(--home-ink); font-size: 14px; font-weight: 600; max-width: 240px; overflow-wrap: anywhere; }
.welcome-footer p, .welcome-footer nav { font-size: 12px; color: var(--ws-muted); }
.welcome-footer nav { display: flex; flex-wrap: wrap; gap: 24px; margin-left: auto; }
.is-compact .landing-hero { display: block; max-width: 850px; padding-top: 120px; padding-bottom: 120px; text-align: center; }
.is-compact h1 { max-width: none; }
.is-compact .welcome-description { margin-left: auto; margin-right: auto; }
.is-compact .landing-hero-links { justify-content: center; }
@media (max-width: 1199px) {
  .landing-hero { gap: 32px; }
  .welcome-nav-actions { gap: 14px; }
  .welcome-models, .welcome-bottom { margin-left: 32px; margin-right: 32px; }
  .welcome-service-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .welcome-nav { padding: 16px 20px; gap: 12px; }
  .welcome-brand { flex: 1; font-size: 17px; gap: 8px; }
  .welcome-brand img, .welcome-brand-mark { height: 28px; width: 28px; }
  .welcome-nav-actions { gap: 2px; }
  .welcome-nav-link { display: none; }
  .welcome-login { padding: 8px 10px; min-height: 36px; font-size: 12px; }
  .landing-hero { grid-template-columns: minmax(0, 1fr); gap: 36px; padding: 44px 20px; }
  .welcome h1 { font-size: clamp(36px, 8.5vw, 48px); max-width: 12em; }
  .welcome-description { font-size: 15px; margin-top: 20px; }
  .welcome-intro-note { margin-bottom: 20px; }
  .landing-hero-links { margin-top: 26px; gap: 20px; }
  .welcome-topics { margin-top: 24px; }
  .welcome-studio { padding: 30px 18px 18px; border-radius: 80px 18px 18px 18px; }
  .welcome-paper { padding: 20px; min-height: 304px; }
  .welcome-studio-caption { padding-left: 18px; }
  .welcome-scenario-content h2 { font-size: 21px; }
  .welcome-scenario-tabs button { flex: 1; min-width: 0; padding: 9px 5px; gap: 4px; font-size: 11px; }
  .welcome-inspiration, .welcome-services { padding: 36px 20px; }
  .welcome-section-heading h2, .welcome-model-intro h2, .welcome-bottom h2 { font-size: 25px; }
  .welcome-scenario-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: 24px; }
  .welcome-scenario-grid article { padding: 24px; }
  .welcome-scenario-grid article > p { min-height: 0; }
  .welcome-scenario-icon { margin-bottom: 16px; }
  .welcome-example { margin-top: 16px; }
  .welcome-models { grid-template-columns: minmax(0, 1fr); gap: 20px; margin: 4px 20px; padding: 28px 24px; }
  .welcome-service-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 20px; margin-top: 28px; }
  .welcome-service { padding: 0; }
  .welcome-service h3 { font-size: 16px; }
  .welcome-service > svg { margin-bottom: 14px; }
  .welcome-bottom { margin: 12px 20px 40px; padding: 32px 24px; }
  .welcome-footer > div { padding: 24px 20px; gap: 14px; }
  .welcome-footer p { flex-basis: 100%; order: 3; }
  .welcome-footer nav { gap: 16px; }
  .is-compact .landing-hero { padding-top: 80px; padding-bottom: 80px; }
}
</style>
