<template>
  <AppLayout>
    <div class="redeem-workspace">
      <div class="redeem-grid">
        <section class="card redeem-entry" aria-labelledby="redeem-heading">
          <div class="redeem-section-heading">
            <h2 id="redeem-heading">{{ t('redeem.redeemButton') }}</h2>
          </div>
          <div class="redeem-form-body">
            <dl class="redeem-account">
              <div>
                <dt>{{ t('redeem.currentBalance') }}</dt>
                <dd>${{ user?.balance?.toFixed(2) || '0.00' }}</dd>
              </div>
              <div>
                <dt>{{ t('redeem.concurrency') }}</dt>
                <dd>{{ user?.concurrency || 0 }} <span>{{ t('redeem.requests') }}</span></dd>
              </div>
            </dl>
            <form @submit.prevent="handleRedeem" :aria-busy="submitting">
              <label for="code" class="input-label">{{ t('redeem.redeemCodeLabel') }}</label>
              <div class="redeem-input-row">
                <input id="code" v-model="redeemCode" type="text" required autocomplete="off"
                  autocapitalize="none" :spellcheck="false" :placeholder="t('redeem.redeemCodePlaceholder')"
                  :disabled="submitting" class="input" :aria-invalid="!!errorMessage"
                  :aria-describedby="errorMessage ? 'redeem-hint redeem-error' : 'redeem-hint'"
                  @input="errorMessage = ''; redeemResult = null" />
                <button type="submit" :disabled="!redeemCode.trim() || submitting" class="btn btn-primary">
                  <Icon v-if="!submitting" name="gift" size="sm" class="mr-2" />
                  <span v-else class="redeem-spinner mr-2" aria-hidden="true" />
                  {{ submitting ? t('redeem.redeeming') : t('redeem.redeemButton') }}
                </button>
              </div>
              <p id="redeem-hint" class="input-hint">{{ t('redeem.redeemCodeHint') }}</p>
            </form>

            <div v-if="errorMessage" id="redeem-error" role="alert" class="redeem-feedback redeem-feedback-error">
              <Icon name="exclamationCircle" size="md" class="shrink-0" />
              <div class="min-w-0"><h3>{{ t('redeem.redeemFailed') }}</h3><p>{{ errorMessage }}</p></div>
            </div>
            <div v-if="redeemResult" role="status" class="redeem-feedback redeem-feedback-success">
              <Icon name="checkCircle" size="md" class="shrink-0" />
              <div class="min-w-0">
                <h3>{{ t('redeem.redeemSuccess') }}</h3>
                <p>{{ redeemResult.message }}</p>
                <p v-if="redeemResult.type === 'balance'">{{ t('redeem.added') }}: <strong>${{ redeemResult.value.toFixed(2) }}</strong></p>
                <p v-else-if="redeemResult.type === 'concurrency'">{{ t('redeem.added') }}: <strong>{{ redeemResult.value }} {{ t('redeem.concurrentRequests') }}</strong></p>
                <p v-else-if="redeemResult.type === 'subscription'">
                  {{ t('redeem.subscriptionAssigned') }}<span v-if="redeemResult.group_name"> · {{ redeemResult.group_name }}</span>
                  <span v-if="redeemResult.validity_days"> ({{ t('redeem.subscriptionDays', { days: redeemResult.validity_days }) }})</span>
                </p>
                <p v-if="redeemResult.new_balance !== undefined">{{ t('redeem.newBalance') }}: <strong>${{ redeemResult.new_balance.toFixed(2) }}</strong></p>
                <p v-if="redeemResult.new_concurrency !== undefined">{{ t('redeem.newConcurrency') }}: <strong>{{ redeemResult.new_concurrency }} {{ t('redeem.requests') }}</strong></p>
              </div>
            </div>
          </div>
        </section>

        <aside class="redeem-guide" aria-labelledby="redeem-guide-heading">
          <h2 id="redeem-guide-heading">{{ t('redeem.aboutCodes') }}</h2>
          <ul>
            <li>{{ t('redeem.codeRule1') }}</li><li>{{ t('redeem.codeRule2') }}</li>
            <li>{{ t('redeem.codeRule4') }}</li><li>{{ t('redeem.codeRule3') }}</li>
          </ul>
          <p v-if="contactInfo" class="redeem-contact">{{ contactInfo }}</p>
        </aside>
      </div>

      <section class="card redeem-history" aria-labelledby="redeem-history-heading" :aria-busy="loadingHistory">
        <div class="redeem-section-heading"><h2 id="redeem-history-heading">{{ t('redeem.recentActivity') }}</h2></div>
        <div v-if="historyError" role="alert" class="redeem-history-error">
          <p>{{ historyError }}</p>
          <button type="button" class="btn btn-secondary btn-sm" :disabled="loadingHistory || submitting"
            @click="fetchHistory(historyPage)">{{ t('common.tryAgain') }}</button>
        </div>
        <div v-if="loadingHistory" role="status" class="redeem-empty">
          <span class="redeem-spinner" aria-hidden="true" /><p>{{ t('common.loading') }}</p>
        </div>
        <ul v-else-if="history.length" class="redeem-history-list">
          <li v-for="item in history" :key="item.id" class="redeem-history-row">
            <div class="redeem-history-icon">
              <Icon :name="isBalanceType(item.type) ? 'dollar' : isSubscriptionType(item.type) ? 'badge' : 'bolt'" size="md" />
            </div>
            <div class="redeem-history-detail">
              <h3>{{ getHistoryItemTitle(item) }}</h3>
              <p>{{ formatDateTime(item.used_at) }}</p>
              <p v-if="item.notes" class="redeem-history-note">{{ item.notes }}</p>
            </div>
            <div class="redeem-history-value">
              <p :class="item.value < 0 ? 'is-negative' : isSubscriptionType(item.type) ? '' : 'is-positive'">{{ formatHistoryValue(item) }}</p>
              <span v-if="!isAdminAdjustment(item.type)" class="font-mono">{{ item.code.slice(0, 8) }}...</span>
              <span v-else>{{ t('redeem.adminAdjustment') }}</span>
            </div>
          </li>
        </ul>
        <div v-else-if="!historyError" class="redeem-empty">
          <Icon name="clock" size="lg" /><p>{{ t('redeem.historyWillAppear') }}</p>
        </div>
        <div class="redeem-pagination">
          <span>{{ t('common.total') }}: {{ historyTotal }} {{ t('pagination.results') }}</span>
          <label class="redeem-page-size">{{ t('pagination.perPage') }}
            <select v-model="historyPageSize" class="input" :disabled="loadingHistory || submitting" @change="fetchHistory(1)">
              <option v-for="size in [20, 50, 100]" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>
          <div class="redeem-page-buttons">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="loadingHistory || submitting || historyPage <= 1" @click="fetchHistory(historyPage - 1)">{{ t('pagination.previous') }}</button>
            <button type="button" class="btn btn-secondary btn-sm" :disabled="loadingHistory || submitting || historyPage * historyPageSize >= historyTotal" @click="fetchHistory(historyPage + 1)">{{ t('pagination.next') }}</button>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { redeemAPI, authAPI, type RedeemHistoryItem } from '@/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'
import { extractApiErrorMessage } from '@/utils/apiError'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const subscriptionStore = useSubscriptionStore()

const user = computed(() => authStore.user)

const redeemCode = ref('')
const submitting = ref(false)
const redeemResult = ref<{
  message: string
  type: string
  value: number
  new_balance?: number
  new_concurrency?: number
  group_name?: string
  validity_days?: number
} | null>(null)
const errorMessage = ref('')

// History data
const history = ref<RedeemHistoryItem[]>([])
const loadingHistory = ref(false)
const historyError = ref('')
const historyPage = ref(1)
const historyPageSize = ref(20)
const historyTotal = ref(0)
let historyRequest = 0
let loadedHistoryPageSize = 20
const contactInfo = ref('')

// Helper functions for history display
const isBalanceType = (type: string) => {
  return type === 'balance' || type === 'admin_balance'
}

const isSubscriptionType = (type: string) => {
  return type === 'subscription'
}

const isAdminAdjustment = (type: string) => {
  return type === 'admin_balance' || type === 'admin_concurrency'
}

const getHistoryItemTitle = (item: RedeemHistoryItem) => {
  if (item.type === 'balance') {
    return t('redeem.balanceAddedRedeem')
  } else if (item.type === 'admin_balance') {
    return item.value >= 0 ? t('redeem.balanceAddedAdmin') : t('redeem.balanceDeductedAdmin')
  } else if (item.type === 'concurrency') {
    return t('redeem.concurrencyAddedRedeem')
  } else if (item.type === 'admin_concurrency') {
    return item.value >= 0 ? t('redeem.concurrencyAddedAdmin') : t('redeem.concurrencyReducedAdmin')
  } else if (item.type === 'subscription') {
    return t('redeem.subscriptionAssigned')
  }
  return t('common.unknown')
}

const formatHistoryValue = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}$${item.value.toFixed(2)}`
  } else if (isSubscriptionType(item.type)) {
    // 订阅类型显示有效天数和分组名称
    const days = item.validity_days || Math.round(item.value)
    const groupName = item.group?.name || ''
    return groupName ? `${days}${t('redeem.days')} - ${groupName}` : `${days}${t('redeem.days')}`
  } else {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}${item.value} ${t('redeem.requests')}`
  }
}

const fetchHistory = async (page = 1) => {
  const request = ++historyRequest
  const pageSize = historyPageSize.value
  loadingHistory.value = true
  try {
    const result = await redeemAPI.getHistory(page, pageSize)
    if (request !== historyRequest) return
    historyError.value = ''
    history.value = result.items
    historyTotal.value = result.total
    historyPage.value = page
    historyPageSize.value = pageSize
    loadedHistoryPageSize = pageSize
  } catch (error) {
    if (request !== historyRequest) return
    historyPageSize.value = loadedHistoryPageSize
    historyError.value = t('redeem.historyLoadFailed')
    appStore.showError(historyError.value)
    console.error('Failed to fetch history:', error)
  } finally {
    if (request === historyRequest) loadingHistory.value = false
  }
}

const handleRedeem = async () => {
  if (submitting.value) return
  if (!redeemCode.value.trim()) {
    appStore.showError(t('redeem.pleaseEnterCode'))
    return
  }

  submitting.value = true
  errorMessage.value = ''
  redeemResult.value = null

  try {
    const result = await redeemAPI.redeem(redeemCode.value.trim())

    redeemResult.value = result

    // Refresh user data to get updated balance/concurrency
    try {
      await authStore.refreshUser()
    } catch (error) {
      console.error('Failed to refresh user after redeem:', error)
      appStore.showWarning(t('redeem.userRefreshFailed'))
    }

    // If subscription type, immediately refresh subscription status
    if (result.type === 'subscription') {
      try {
        await subscriptionStore.fetchActiveSubscriptions(true) // force refresh
      } catch (error) {
        console.error('Failed to refresh subscriptions after redeem:', error)
        appStore.showWarning(t('redeem.subscriptionRefreshFailed'))
      }
    }

    // Clear the input
    redeemCode.value = ''

    // Refresh history
    await fetchHistory()

    // Show success toast
    appStore.showSuccess(t('redeem.codeRedeemSuccess'))
  } catch (error: unknown) {
    errorMessage.value = extractApiErrorMessage(error, t('redeem.failedToRedeem'))

    appStore.showError(t('redeem.redeemFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  fetchHistory()
  try {
    const settings = await authAPI.getPublicSettings()
    contactInfo.value = settings.contact_info || ''
  } catch (error) {
    console.error('Failed to load contact info:', error)
  }
})
</script>

<style scoped>
.redeem-workspace { max-width: 1100px; margin-inline: auto; color: var(--ws-text); }
.redeem-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 32px; align-items: start; margin-bottom: 24px; }
.redeem-section-heading { padding: 20px 24px; border-bottom: 1px solid var(--ws-border); }
.redeem-section-heading h2, .redeem-guide h2 { font-size: 15px; font-weight: 600; }
.redeem-form-body { padding: 24px; }
.redeem-account { display: flex; flex-wrap: wrap; gap: 16px 32px; padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--ws-border); }
.redeem-account dt { color: var(--ws-muted); font-size: 13px; }
.redeem-account dd { margin-top: 4px; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
.redeem-account dd span { font-size: 13px; font-weight: 400; color: var(--ws-muted); }
.redeem-input-row { display: flex; gap: 12px; }
.redeem-input-row input { min-width: 0; flex: 1; }
.redeem-input-row button { flex-shrink: 0; }
.redeem-input-row input[aria-invalid='true'] { border-color: #dc2626; }
.redeem-guide { padding: 20px 0; font-size: 13px; color: var(--ws-muted); }
.redeem-guide h2 { color: var(--ws-text); }
.redeem-guide ul { margin-top: 16px; padding-left: 18px; list-style: disc; }
.redeem-guide li + li { margin-top: 12px; }
.redeem-contact { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ws-border); white-space: pre-line; overflow-wrap: anywhere; }
.redeem-feedback { display: flex; align-items: flex-start; gap: 12px; padding: 16px; margin-top: 20px; border-radius: 6px; font-size: 13px; overflow-wrap: anywhere; }
.redeem-feedback h3 { font-weight: 600; }
.redeem-feedback p { margin-top: 4px; }
.redeem-feedback-error { @apply text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-900/20; }
.redeem-feedback-success { @apply text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20; }
.redeem-history-error { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px; color: #b91c1c; font-size: 13px; }
.dark .redeem-history-error { color: #fca5a5; }
.redeem-empty { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; padding: 40px 24px; color: var(--ws-muted); font-size: 13px; text-align: center; }
.redeem-history-row { display: grid; grid-template-columns: 36px minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: 12px; padding: 16px 24px; }
.redeem-history-row + .redeem-history-row { border-top: 1px solid var(--ws-border); }
.redeem-history-icon { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 6px; background: var(--ws-inset); color: var(--ws-muted); }
.redeem-history-detail h3 { font-size: 13px; font-weight: 500; }
.redeem-history-detail p { font-size: 12px; color: var(--ws-muted); margin-top: 4px; }
.redeem-history-note { overflow-wrap: anywhere; }
.redeem-history-value { text-align: right; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.redeem-history-value p { font-size: 13px; font-weight: 600; }
.redeem-history-value span { font-size: 12px; color: var(--ws-muted); }
.is-positive { color: #047857; }
.is-negative { color: #b91c1c; }
.dark .is-positive { color: #6ee7b7; }
.dark .is-negative { color: #fca5a5; }
.redeem-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 16px 24px; border-top: 1px solid var(--ws-border); font-size: 13px; color: var(--ws-muted); }
.redeem-page-size { display: flex; align-items: center; gap: 8px; }
.redeem-page-size select { width: 76px; min-height: 34px; padding-block: 4px; }
.redeem-page-buttons { display: flex; gap: 8px; margin-left: auto; }
.redeem-spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: redeem-spin 700ms linear infinite; }
@keyframes redeem-spin { to { transform: rotate(360deg); } }
@media (max-width: 767px) {
  .redeem-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .redeem-guide { padding: 4px 4px 8px; }
  .redeem-section-heading, .redeem-form-body { padding: 20px; }
  .redeem-input-row { flex-direction: column; }
  .redeem-history-row { grid-template-columns: 32px minmax(0, 1fr); padding: 16px 20px; }
  .redeem-history-icon { width: 32px; height: 32px; }
  .redeem-history-value { grid-column: 2; text-align: left; }
  .redeem-pagination { padding: 16px 20px; }
}
@media (prefers-reduced-motion: reduce) { .redeem-spinner { animation: none; } }
</style>
