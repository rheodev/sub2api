<template>
  <AppLayout>
    <div class="subscriptions-page">
      <div class="subscriptions-toolbar">
        <p role="status">{{ loading ? t('common.loading') : hasLoaded ? t('userSubscriptions.subscriptionCount', { count: subscriptions.length }) : t('userSubscriptions.failedToLoad') }}</p>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="loadSubscriptions">
          <Icon name="refresh" size="sm" :class="{ 'animate-spin': loading }" />
          {{ t('common.refresh') }}
        </button>
      </div>

      <div v-if="loadError" class="subscriptions-error" role="alert">
        <div>
          <h2>{{ t('userSubscriptions.failedToLoad') }}</h2>
          <p>{{ t(hasLoaded ? 'userSubscriptions.refreshErrorHint' : 'userSubscriptions.loadErrorHint') }}</p>
        </div>
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="loadSubscriptions">{{ t('userSubscriptions.retry') }}</button>
      </div>

      <div v-if="loading && !hasLoaded" class="subscriptions-grid" :aria-label="t('common.loading')" aria-busy="true">
        <div v-for="i in 2" :key="i" class="card subscription-skeleton" aria-hidden="true">
          <div v-for="line in 4" :key="line" class="animate-pulse" />
        </div>
      </div>

      <div v-else-if="hasLoaded && subscriptions.length === 0" class="card subscriptions-empty">
        <Icon name="creditCard" size="xl" />
        <h2>{{ t('userSubscriptions.noActiveSubscriptions') }}</h2>
        <p>{{ t('userSubscriptions.noActiveSubscriptionsDesc') }}</p>
        <RouterLink v-if="canPurchase" class="btn btn-primary" to="/purchase?tab=subscription">{{ t('userSubscriptions.viewPlans') }}</RouterLink>
      </div>

      <div v-else-if="hasLoaded" class="subscriptions-grid" :aria-busy="loading">
        <article v-for="subscription in subscriptions" :key="subscription.id" class="card subscription-card" :aria-labelledby="`subscription-title-${subscription.id}`">
          <header class="subscription-header">
            <div class="subscription-identity">
              <div class="subscription-title">
                <h2 :id="`subscription-title-${subscription.id}`">{{ subscription.group?.name || t('userSubscriptions.groupFallback', { id: subscription.group_id }) }}</h2>
                <span v-if="subscription.group?.platform" :class="['subscription-platform', platformBadgeClass(subscription.group.platform)]">{{ platformLabel(subscription.group.platform) }}</span>
              </div>
              <p v-if="subscription.group?.description" class="subscription-description">{{ subscription.group.description }}</p>
              <div v-if="subscription.group" class="subscription-rates">
                <span>{{ t('payment.planCard.rate') }}: ×{{ subscription.group.rate_multiplier ?? 1 }}</span>
                <span v-if="subscriptionHasPeakRate(subscription)" class="text-amber-700 dark:text-amber-300">{{ t('payment.planCard.peakRate') }}: {{ subscriptionPeakRateLabel(subscription) }}</span>
              </div>
            </div>
            <span :class="['badge', subscription.status === 'active' ? 'badge-success' : subscription.status === 'expired' ? 'badge-gray' : 'badge-danger']">{{ t(`userSubscriptions.status.${subscription.status}`) }}</span>
          </header>

          <div class="subscription-body">
            <div class="subscription-expiration">
              <span>{{ t('userSubscriptions.expires') }}</span>
              <span v-if="subscription.expires_at" :class="getExpirationClass(subscription.expires_at)">{{ formatExpirationDate(subscription.expires_at) }}</span>
              <span v-else>{{ t('userSubscriptions.noExpiration') }}</span>
            </div>

            <div v-if="!subscription.group" class="subscription-notice">{{ t('userSubscriptions.detailsUnavailable') }}</div>
            <template v-else>
              <div v-for="quota in quotaRows(subscription)" :key="quota.key" class="subscription-quota">
                <div class="subscription-quota-heading">
                  <h3>{{ quota.label }}</h3>
                  <span class="tabular-nums">${{ quota.used.toFixed(2) }} <span class="subscription-muted">/ ${{ quota.limit.toFixed(2) }}</span></span>
                </div>
                <div class="subscription-progress" role="progressbar" :aria-label="quota.label" :aria-valuenow="Math.min(quota.used, quota.limit)" :aria-valuemin="0" :aria-valuemax="quota.limit" :aria-valuetext="t('userSubscriptions.usageOf', { used: '$' + quota.used.toFixed(2), limit: '$' + quota.limit.toFixed(2) })">
                  <div :class="getProgressBarClass(quota.used, quota.limit)" :style="{ width: getProgressWidth(quota.used, quota.limit) }" />
                </div>
                <div class="subscription-quota-details">
                  <span :class="{ 'text-red-600 dark:text-red-400': quota.used >= quota.limit }">{{ quota.used >= quota.limit ? t('userSubscriptions.quotaExhausted') : t('userSubscriptions.remainingQuota', { amount: (quota.limit - quota.used).toFixed(2) }) }}</span>
                  <span v-if="subscription.status === 'active'">{{ quota.reset }}</span>
                </div>
              </div>
              <div v-if="quotaRows(subscription).length === 0" class="subscription-notice">
                <h3>{{ t('userSubscriptions.unlimited') }}</h3>
                <p>{{ t('userSubscriptions.unlimitedDesc') }}</p>
              </div>
            </template>
          </div>
          <footer v-if="canPurchase && subscription.status === 'active'" class="subscription-footer">
            <RouterLink class="btn btn-primary" :to="{ path: '/purchase', query: { tab: 'subscription', group: String(subscription.group_id) } }">{{ t('payment.renewNow') }}</RouterLink>
          </footer>
        </article>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import subscriptionsAPI from '@/api/subscriptions'
import type { UserSubscription } from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTimeToMinute } from '@/utils/format'
import { hasPeakRate, formatPeakRateWindow, serverTimezoneLabel } from '@/utils/peak-rate'
import { platformBadgeClass, platformLabel } from '@/utils/platformColors'
import {
  getExpirationDateRelation,
  getRemainingDurationParts,
  isOneTimeDailyQuota,
  type RemainingDurationParts
} from '@/utils/subscriptionQuota'

const { t } = useI18n()
const appStore = useAppStore()

const subscriptions = ref<UserSubscription[]>([])
const loading = ref(true)
const loadError = ref(false)
const hasLoaded = ref(false)
const now = ref(new Date())
const canPurchase = computed(() => appStore.cachedPublicSettings?.payment_enabled === true)
let clockTimer: ReturnType<typeof setInterval> | undefined
let disposed = false

function quotaRows(subscription: UserSubscription) {
  const group = subscription.group
  if (!group) return []
  return [
    { key: 'daily', label: t('userSubscriptions.daily'), limit: group.daily_limit_usd, used: subscription.daily_usage_usd, reset: formatDailyUsageWindow(subscription) },
    { key: 'weekly', label: t('userSubscriptions.weekly'), limit: group.weekly_limit_usd, used: subscription.weekly_usage_usd, reset: formatResetLabel(subscription.weekly_window_start, 168) },
    { key: 'monthly', label: t('userSubscriptions.monthly'), limit: group.monthly_limit_usd, used: subscription.monthly_usage_usd, reset: formatResetLabel(subscription.monthly_window_start, 720) }
  ].filter((quota): quota is typeof quota & { limit: number } => typeof quota.limit === 'number' && quota.limit > 0)
    .map(quota => ({ ...quota, used: Math.max(quota.used || 0, 0) }))
}

function subscriptionHasPeakRate(subscription: UserSubscription): boolean {
  return hasPeakRate(subscription.group)
}

function subscriptionPeakRateLabel(subscription: UserSubscription): string {
  return formatPeakRateWindow(subscription.group, serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset))
}

async function loadSubscriptions() {
  try {
    loading.value = true
    loadError.value = false
    const result = await subscriptionsAPI.getMySubscriptions()
    if (disposed) return
    subscriptions.value = result
    hasLoaded.value = true
    now.value = new Date()
  } catch {
    if (!disposed) loadError.value = true
  } finally {
    loading.value = false
  }
}

function getProgressWidth(used: number | undefined, limit: number | null | undefined): string {
  if (!limit || limit === 0) return '0%'
  const percentage = Math.max(0, Math.min(((used || 0) / limit) * 100, 100))
  return `${percentage}%`
}

function getProgressBarClass(used: number | undefined, limit: number | null | undefined): string {
  if (!limit || limit === 0) return 'bg-gray-400'
  const percentage = ((used || 0) / limit) * 100
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-orange-500'
  return 'bg-green-500'
}

function formatExpirationDate(expiresAt: string): string {
  const currentTime = now.value
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - currentTime.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  const relation = getExpirationDateRelation(expires, currentTime)

  if (relation === null) return ''

  if (relation === 'expired') {
    return `${t('userSubscriptions.status.expired')} (${formatDateTimeToMinute(expires)})`
  }

  const dateStr = formatDateTimeToMinute(expires)

  if (relation === 'today') {
    return `${dateStr} (${t('common.today')})`
  }
  if (relation === 'tomorrow') {
    return `${dateStr} (${t('common.tomorrow')})`
  }

  return t('userSubscriptions.daysRemaining', { days }) + ` (${dateStr})`
}

function getExpirationClass(expiresAt: string): string {
  const currentTime = now.value
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - currentTime.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (diff <= 0) return 'text-red-600 dark:text-red-400 font-medium'
  if (days <= 3) return 'text-red-600 dark:text-red-400'
  if (days <= 7) return 'text-orange-600 dark:text-orange-400'
  return 'text-gray-700 dark:text-gray-300'
}

function formatDurationParts(parts: RemainingDurationParts): string {
  if (parts.days > 0) {
    return t('userSubscriptions.durationDays', { days: parts.days, hours: parts.hours })
  }

  if (parts.hours > 0) {
    return t('userSubscriptions.durationHours', { hours: parts.hours, minutes: parts.minutes })
  }

  return t('userSubscriptions.durationMinutes', { minutes: parts.minutes })
}

function formatDailyUsageWindow(subscription: UserSubscription): string {
  if (isOneTimeDailyQuota(subscription) && subscription.expires_at) {
    const parts = getRemainingDurationParts(subscription.expires_at, now.value)
    if (!parts) return t('userSubscriptions.quotaEnded')
    return t('userSubscriptions.quotaEndsIn', { time: formatDurationParts(parts) })
  }

  return formatResetLabel(subscription.daily_window_start, 24)
}

function formatResetLabel(windowStart: string | null, windowHours: number): string {
  if (!windowStart) return t('userSubscriptions.windowNotActive')

  const start = new Date(windowStart)
  const end = new Date(start.getTime() + windowHours * 60 * 60 * 1000)
  const parts = getRemainingDurationParts(end, now.value)

  return parts ? t('userSubscriptions.resetIn', { time: formatDurationParts(parts) }) : t('userSubscriptions.resetDue')
}

onMounted(() => {
  loadSubscriptions()
  clockTimer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  disposed = true
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<style scoped>
.subscriptions-page { display: flex; flex-direction: column; gap: 20px; }
.subscriptions-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.subscriptions-toolbar p { color: var(--ws-muted); font-size: 13px; }
.subscriptions-toolbar .btn { gap: 8px; }
.subscriptions-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 20px; }
.subscription-card { padding: 0; overflow: hidden; min-width: 0; }
.subscription-header { display: flex; justify-content: space-between; align-items: start; gap: 16px; padding: 20px; border-bottom: 1px solid var(--ws-border); }
.subscription-identity { min-width: 0; }
.subscription-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.subscription-title h2 { font-size: 16px; line-height: 1.5; font-weight: 650; color: var(--ws-text); overflow-wrap: anywhere; }
.subscription-header > .badge { flex-shrink: 0; margin-top: 3px; }
.subscription-platform { border-width: 1px; border-radius: 4px; padding: 2px 8px; font-size: 11px; }
.subscription-description { margin-top: 6px; font-size: 13px; color: var(--ws-muted); overflow-wrap: anywhere; }
.subscription-rates { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 10px; font-size: 12px; color: var(--ws-muted); }
.subscription-body { padding: 20px; }
.subscription-expiration { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 13px; }
.subscription-expiration > :first-child { color: var(--ws-muted); flex-shrink: 0; }
.subscription-expiration > :last-child { text-align: right; overflow-wrap: anywhere; }
.subscription-quota { margin-top: 24px; }
.subscription-quota-heading { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; font-size: 14px; color: var(--ws-text); }
.subscription-quota-heading h3 { font-weight: 500; }
.subscription-muted { color: var(--ws-muted); }
.subscription-progress { height: 6px; margin-top: 10px; border-radius: 4px; background: var(--ws-inset); overflow: hidden; }
.subscription-progress > div { height: 100%; border-radius: inherit; transition: width 180ms ease-out; }
.subscription-quota-details { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font-size: 12px; color: var(--ws-muted); }
.subscription-notice { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--ws-border); color: var(--ws-muted); font-size: 13px; }
.subscription-notice h3 { color: var(--ws-text); font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.subscription-footer { display: flex; justify-content: flex-end; border-top: 1px solid var(--ws-border); padding: 14px 20px; }
.subscriptions-error { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 20px; border: 1px solid var(--ws-border); border-radius: 10px; background: var(--ws-surface); }
.subscriptions-error h2 { color: var(--ws-text); font-weight: 600; font-size: 14px; }
.subscriptions-error p { margin-top: 4px; font-size: 13px; color: var(--ws-muted); }
.subscriptions-error .btn { flex-shrink: 0; }
.subscriptions-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 24px; text-align: center; color: var(--ws-muted); }
.subscriptions-empty h2 { font-size: 16px; color: var(--ws-text); font-weight: 600; }
.subscriptions-empty p { font-size: 14px; max-width: 50ch; }
.subscription-skeleton { display: flex; flex-direction: column; gap: 24px; padding: 24px; }
.subscription-skeleton > div { height: 20px; border-radius: 4px; background: var(--ws-inset); }
.subscription-skeleton > div:first-child { width: 60%; }
@media (max-width: 1023px) {
  .subscriptions-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 479px) {
  .subscription-header, .subscription-body { padding: 16px; }
  .subscription-header { gap: 10px; }
  .subscription-footer { padding: 12px 16px; }
  .subscriptions-error { align-items: flex-start; flex-direction: column; padding: 16px; }
  .subscription-expiration { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .subscription-progress > div { transition: none; }
}
</style>
