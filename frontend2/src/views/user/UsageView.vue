<template>
  <AppLayout>
    <div class="usage-workspace">
      <div :aria-busy="endpointStatsLoading" :aria-label="t('usage.summary')">
        <p v-if="!usageStats && endpointStatsLoading" class="usage-feedback" role="status">{{ t('common.loading') }}</p>
        <UsageStatsCards v-else-if="!statsError" compact :stats="usageStats" :show-account-cost="false" :strike-standard-cost="true" />
      </div>

      <div class="usage-period">
        <div class="usage-period-field">
          <span>{{ t('admin.dashboard.timeRange') }}</span>
          <DateRangePicker v-model:start-date="startDate" v-model:end-date="endDate" @change="onDateRangeChange" />
        </div>
        <button type="button" class="btn btn-secondary" :aria-expanded="showCharts" aria-controls="usage-charts" @click="showCharts = !showCharts">
          <Icon name="chart" size="sm" />
          {{ showCharts ? t('usage.hideAnalysis') : t('usage.showAnalysis') }}
          <Icon name="chevronDown" size="sm" :class="{ 'rotate-180': showCharts }" />
        </button>
      </div>

      <div v-if="statsError || modelStatsError || chartError" class="usage-feedback" role="alert">
        <p>{{ t('usage.analysisFailed') }}</p>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="endpointStatsLoading || modelStatsLoading || chartsLoading" @click="retryAnalysis">{{ t('common.tryAgain') }}</button>
      </div>
      <div v-if="showCharts" id="usage-charts" class="space-y-4">
        <div class="usage-period-field usage-granularity">
          <label for="usage-granularity">{{ t('admin.dashboard.granularity') }}</label>
          <Select id="usage-granularity" :aria-label="t('admin.dashboard.granularity')" v-model="granularity" :options="granularityOptions" @change="loadChartData" />
        </div>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ModelDistributionChart
            v-model:metric="modelDistributionMetric"
            :model-stats="requestedModelStats"
            :loading="modelStatsLoading"
            :show-source-toggle="false"
            :show-metric-toggle="true"
            :enable-breakdown="false"
            :show-account-cost="false"
            :start-date="startDate"
            :end-date="endDate"
          />
          <GroupDistributionChart
            v-model:metric="groupDistributionMetric"
            :group-stats="groupStats"
            :loading="chartsLoading"
            :show-metric-toggle="true"
            :enable-breakdown="false"
            :show-account-cost="false"
            :start-date="startDate"
            :end-date="endDate"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EndpointDistributionChart
            v-model:source="endpointDistributionSource"
            v-model:metric="endpointDistributionMetric"
            :endpoint-stats="inboundEndpointStats"
            :upstream-endpoint-stats="upstreamEndpointStats"
            :endpoint-path-stats="endpointPathStats"
            :loading="endpointStatsLoading"
            :show-source-toggle="false"
            :show-metric-toggle="true"
            :enable-breakdown="false"
            :title="t('usage.endpointDistribution')"
            :start-date="startDate"
            :end-date="endDate"
          />
          <TokenUsageTrend :trend-data="trendData" :loading="chartsLoading" />
        </div>
      </div>

      <section class="card usage-detail" aria-labelledby="usage-detail-heading">
        <div class="usage-detail-heading">
          <div v-if="errorViewEnabled" role="tablist" :aria-label="t('usage.title')" class="usage-tabs" @keydown="onTabKeydown">
            <button v-for="tab in detailTabs" :id="`usage-tab-${tab.key}`" :key="tab.key" type="button" role="tab"
              :aria-selected="activeTab === tab.key" :tabindex="activeTab === tab.key ? 0 : -1"
              :aria-controls="`usage-panel-${tab.key}`" :class="{ 'is-active': activeTab === tab.key }"
              @click="selectTab(tab.key)">{{ tab.label }}</button>
          </div>
          <h2 v-else id="usage-detail-heading">{{ t('usage.tabs.usage') }}</h2>
          <span v-if="!currentLoading && !currentLoadError" class="usage-record-count" role="status">{{ t('usage.recordCount', { count: activeTab === 'usage' ? pagination.total : errorTotal }) }}</span>
        </div>
        <h2 v-if="errorViewEnabled" id="usage-detail-heading" class="sr-only">{{ t('usage.title') }}</h2>
        <div class="usage-filter-area">
          <div class="usage-filters">
            <div v-if="activeTab === 'errors'" class="usage-filter-grid usage-error-filters">
              <div class="usage-filter-field">
                <label for="usage-filter-error-key" class="input-label">{{ t('usage.errors.keyName') }}</label>
                <Select id="usage-filter-error-key" :aria-label="t('usage.errors.keyName')" v-model="errorFilter.api_key_id" :options="errorKeyOptions" @change="applyErrorFilters" />
              </div>
              <div class="usage-filter-field">
                <label for="usage-filter-error-model" class="input-label">{{ t('usage.errors.model') }}</label>
                <Select
                  id="usage-filter-error-model"
                  :aria-label="t('usage.errors.model')"
                  v-model="errorFilter.model"
                  :options="errorModelOptions"
                  searchable
                  creatable
                  clearable
                  :placeholder="t('usage.errors.modelPlaceholder')"
                  @change="applyErrorFilters"
                />
              </div>
              <div class="usage-filter-field">
                <label for="usage-filter-category" class="input-label">{{ t('usage.errors.category') }}</label>
                <Select id="usage-filter-category" :aria-label="t('usage.errors.category')" v-model="errorFilter.category" :options="errorCategoryOptions" @change="applyErrorFilters" />
              </div>
              <div class="usage-filter-field">
                <label for="usage-filter-status" class="input-label">{{ t('usage.errors.status') }}</label>
                <Select id="usage-filter-status" :aria-label="t('usage.errors.status')" v-model="errorFilter.status_code" :options="errorStatusOptions" @change="applyErrorFilters" />
              </div>
            </div>
            <div v-else class="usage-filter-grid">
              <div class="usage-filter-field">
                <label for="usage-filter-key" class="input-label">{{ t('usage.apiKeyFilter') }}</label>
                <Select id="usage-filter-key" :aria-label="t('usage.apiKeyFilter')" v-model="filters.api_key_id" :options="apiKeyOptions" :placeholder="t('usage.allApiKeys')" @change="applyFilters" />
              </div>
              <div class="usage-filter-field">
                <label for="usage-filter-model" class="input-label">{{ t('usage.model') }}</label>
                <Select id="usage-filter-model" :aria-label="t('usage.model')" v-model="filters.model" :options="modelOptions" :placeholder="t('admin.usage.allModels')" searchable @change="applyFilters" />
              </div>
              <div class="usage-filter-field">
                <label for="usage-filter-group" class="input-label">{{ t('admin.usage.group') }}</label>
                <Select id="usage-filter-group" :aria-label="t('admin.usage.group')" v-model="filters.group_id" :options="groupOptions" :placeholder="t('admin.usage.allGroups')" searchable @change="applyFilters" />
              </div>
              <div v-show="showAdvancedFilters" id="usage-advanced-filters" class="usage-advanced-grid">
                <div class="usage-filter-field">
                  <label for="usage-filter-request-type" class="input-label">{{ t('usage.type') }}</label>
                  <Select id="usage-filter-request-type" :aria-label="t('usage.type')" v-model="filters.request_type" :options="requestTypeOptions" :placeholder="t('admin.usage.allTypes')" @change="applyFilters" />
                </div>
                <div class="usage-filter-field">
                  <label for="usage-filter-compaction" class="input-label">{{ t('usage.compactionFilter') }}</label>
                  <Select id="usage-filter-compaction" :aria-label="t('usage.compactionFilter')" v-model="filters.native_compaction_v2" :options="compactionOptions" @change="applyFilters" />
                </div>
                <div v-if="subscriptionFeatureEnabled" class="usage-filter-field">
                  <label for="usage-filter-billing-type" class="input-label">{{ t('admin.usage.billingType') }}</label>
                  <Select id="usage-filter-billing-type" :aria-label="t('admin.usage.billingType')" v-model="filters.billing_type" :options="billingTypeOptions" @change="applyFilters" />
                </div>
                <div class="usage-filter-field">
                  <label for="usage-filter-billing-mode" class="input-label">{{ t('admin.usage.billingMode') }}</label>
                  <Select id="usage-filter-billing-mode" :aria-label="t('admin.usage.billingMode')" v-model="filters.billing_mode" :options="billingModeOptions" @change="applyFilters" />
                </div>
              </div>
            </div>

            <div class="usage-actions">
              <button v-if="activeTab === 'usage'" type="button" class="btn btn-secondary" :aria-expanded="showAdvancedFilters"
                aria-controls="usage-advanced-filters" @click="showAdvancedFilters = !showAdvancedFilters">
                {{ t('usage.moreFilters') }}<span v-if="advancedFilterCount" class="usage-filter-count">{{ advancedFilterCount }}</span>
                <Icon name="chevronDown" size="sm" :class="{ 'rotate-180': showAdvancedFilters }" />
              </button>
              <button type="button" @click="refreshData" :disabled="currentLoading" class="btn btn-secondary">
                {{ t('common.refresh') }}
              </button>
              <button type="button" @click="resetFilters" class="btn btn-secondary">
                {{ t('common.reset') }}
              </button>
              <div class="relative" ref="columnDropdownRef" @keydown.esc.stop="closeColumnDropdown">
                <button
                  type="button"
                  data-testid="usage-column-settings"
                  :aria-expanded="showColumnDropdown" aria-controls="usage-column-options"
                  @click="showColumnDropdown = !showColumnDropdown"
                  class="btn btn-secondary px-2 md:px-3"
                  :title="t('admin.users.columnSettings')"
                >
                  <Icon name="grid" size="sm" />
                  <span class="hidden md:inline">{{ t('admin.users.columnSettings') }}</span>
                </button>
                <div
                  v-if="showColumnDropdown" id="usage-column-options"
                  class="absolute right-0 top-full z-50 mt-1 max-h-80 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800"
                >
                  <button
                    v-for="col in currentToggleableColumns"
                    :key="col.key"
                    type="button"
                    :data-testid="`usage-column-toggle-${col.key}`"
                    :aria-pressed="isCurrentColumnVisible(col.key)"
                    @click="toggleCurrentColumn(col.key)"
                    class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                  >
                    <span>{{ col.label }}</span>
                    <Icon v-if="isCurrentColumnVisible(col.key)" name="check" size="sm" class="text-primary-500" />
                  </button>
                </div>
              </div>
              <button v-if="activeTab !== 'errors'" type="button" @click="exportToCSV" :disabled="exporting || loading || logsError || pagination.total === 0" class="btn btn-primary">
                {{ exporting ? t('usage.exporting') : t('usage.exportCsv') }}
              </button>
            </div>
          </div>
        </div>
        <div :id="`usage-panel-${activeTab}`" class="usage-records" :role="errorViewEnabled ? 'tabpanel' : undefined"
          :aria-labelledby="errorViewEnabled ? `usage-tab-${activeTab}` : 'usage-detail-heading'" :aria-busy="currentLoading">
          <div v-if="currentLoadError" class="usage-feedback usage-record-error" role="alert">
            <p>{{ activeTab === 'usage' ? t('usage.failedToLoad') : t('usage.errors.failedToLoad') }}</p>
            <button type="button" class="btn btn-secondary btn-sm" @click="retryRecords">{{ t('common.tryAgain') }}</button>
          </div>
          <template v-else-if="activeTab === 'usage'">
            <UsageTable
              flat
              :data="usageLogs"
              :loading="loading"
              :columns="visibleColumns"
              :server-side-sort="true"
              :show-account-billing="false"
              :show-upstream-endpoint="false"
              default-sort-key="created_at"
              default-sort-order="desc"
              @sort="handleSort"
              @ipGeoBatchFailed="handleIpGeoBatchFailed"
            />

            <Pagination
              v-if="pagination.total > 0"
              :page="pagination.page"
              :total="pagination.total"
              :page-size="pagination.page_size"
              @update:page="handlePageChange"
              @update:pageSize="handlePageSizeChange"
            />
          </template>

          <UserErrorRequestsTable
            v-else-if="errorViewEnabled"
            flat
            :rows="errorRows"
            :total="errorTotal"
            :loading="errorLoading"
            :page="errorPage"
            :page-size="errorPageSize"
            :visible-column-keys="errVisibleColumnKeys"
            @sort="onErrorSort"
            @update:page="onErrorPage"
            @update:pageSize="onErrorPageSize"
            @ipGeoBatchFailed="handleIpGeoBatchFailed"
          />
        </div>
      </section>
    </div>
  </AppLayout>

</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { FeatureFlags, resolveFeatureFlag } from '@/utils/featureFlags'
import { keysAPI, usageAPI, userGroupsAPI } from '@/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import Pagination from '@/components/common/Pagination.vue'
import Select, { type SelectOption } from '@/components/common/Select.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import UsageStatsCards from '@/components/admin/usage/UsageStatsCards.vue'
import UsageTable from '@/components/admin/usage/UsageTable.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import GroupDistributionChart from '@/components/charts/GroupDistributionChart.vue'
import EndpointDistributionChart from '@/components/charts/EndpointDistributionChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import Icon from '@/components/icons/Icon.vue'
import UserErrorRequestsTable from '@/components/user/UserErrorRequestsTable.vue'
import { getPersistedPageSize } from '@/composables/usePersistedPageSize'
import { formatReasoningEffort } from '@/utils/format'
import { getBillingModeLabel, getDisplayBillingMode as resolveDisplayBillingMode } from '@/utils/billingMode'
import { resolveUsageRequestType, requestTypeToLegacyStream } from '@/utils/usageRequestType'
import type {
  ApiKey,
  EndpointStat,
  Group,
  GroupStat,
  ModelStat,
  TrendDataPoint,
  UsageLog,
  UsageQueryParams,
  UsageStatsResponse,
  UserErrorRequest,
} from '@/types'
import type { Column } from '@/components/common/types'
import { COMMON_ERROR_STATUS_CODES } from '@/utils/errorBadges'

const { t } = useI18n()
const appStore = useAppStore()

type DistributionMetric = 'tokens' | 'actual_cost'
type EndpointSource = 'inbound' | 'upstream' | 'path'

const usageStats = ref<UsageStatsResponse | null>(null)
const usageLogs = ref<UsageLog[]>([])
const trendData = ref<TrendDataPoint[]>([])
const requestedModelStats = ref<ModelStat[]>([])
const groupStats = ref<GroupStat[]>([])
const inboundEndpointStats = ref<EndpointStat[]>([])
const upstreamEndpointStats = ref<EndpointStat[]>([])
const endpointPathStats = ref<EndpointStat[]>([])

const loading = ref(false)
const chartsLoading = ref(false)
const modelStatsLoading = ref(false)
const endpointStatsLoading = ref(false)
const exporting = ref(false)
const showCharts = ref(false)
const showAdvancedFilters = ref(false)
const logsError = ref(false)
const errorsError = ref(false)
const statsError = ref(false)
const modelStatsError = ref(false)
const chartError = ref(false)
let errorReqSeq = 0
const errorRows = ref<UserErrorRequest[]>([])
const errorLoading = ref(false)
const errorPage = ref(1)
const errorPageSize = ref(20)
const errorSortBy = ref('created_at')
const errorSortOrder = ref<'asc' | 'desc'>('desc')
const errorTotal = ref(0)
const errorFilter = ref<{ model: string | null; category: string; api_key_id: number | null; status_code: number | null }>({
  model: '',
  category: '',
  api_key_id: null,
  status_code: null,
})

const errorKeyOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.errors.allKeys') },
  ...apiKeys.value.map((k) => ({ value: k.id, label: k.name })),
])

// 模型候选取自当前已加载错误中出现过的模型；creatable 允许输入任意片段做后端模糊。
const errorModelOptions = computed<SelectOption[]>(() => {
  const seen = new Set<string>()
  const opts: SelectOption[] = []
  for (const r of errorRows.value) {
    if (r.model && !seen.has(r.model)) {
      seen.add(r.model)
      opts.push({ value: r.model, label: r.model })
    }
  }
  return opts
})

const errorCategoryCodes = ['auth', 'rate_limit', 'quota', 'invalid_request', 'service_unavailable', 'upstream', 'internal', 'cyber']

const errorCategoryOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('usage.errors.allCategories') },
  ...errorCategoryCodes.map((c) => ({ value: c, label: t('usage.errors.categories.' + c) })),
])

// 状态码候选用固定常用列表(与管理端 UsageFilters 共用常量),不受当前页数据限制:
// 后端 status_code 过滤对全量生效,若只列当前页出现过的码,用户就选不到仅在后续页的码。
const errorStatusOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.errors.allStatuses') },
  ...COMMON_ERROR_STATUS_CODES.map((c) => ({ value: c, label: String(c) })),
])

const applyErrorFilters = () => {
  errorPage.value = 1
  void loadErrors()
}

let abortController: AbortController | null = null
let chartReqSeq = 0
let statsReqSeq = 0
let modelStatsReqSeq = 0

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getLast24HoursRangeDates = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return { start: formatLocalDate(start), end: formatLocalDate(end) }
}

const getGranularityForRange = (start: string, end: string): 'day' | 'hour' => {
  const startTime = new Date(`${start}T00:00:00`).getTime()
  const endTime = new Date(`${end}T00:00:00`).getTime()
  return Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)) <= 1 ? 'hour' : 'day'
}

const defaultRange = getLast24HoursRangeDates()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)
const granularity = ref<'day' | 'hour'>(getGranularityForRange(startDate.value, endDate.value))

const modelDistributionMetric = ref<DistributionMetric>('tokens')
const groupDistributionMetric = ref<DistributionMetric>('tokens')
const endpointDistributionMetric = ref<DistributionMetric>('tokens')
const endpointDistributionSource = ref<EndpointSource>('inbound')
const activeTab = ref<'usage' | 'errors'>('usage')
const errorViewEnabled = computed(() => appStore.cachedPublicSettings?.allow_user_view_error_requests ?? false)
const detailTabs = computed(() => [
  { key: 'usage' as const, label: t('usage.tabs.usage') },
  { key: 'errors' as const, label: t('usage.tabs.errors') },
])
const currentLoading = computed(() => activeTab.value === 'usage' ? loading.value : errorLoading.value)
const currentLoadError = computed(() => activeTab.value === 'usage' ? logsError.value : errorsError.value)
const advancedFilterCount = computed(() => [
  filters.value.request_type, filters.value.native_compaction_v2,
  subscriptionFeatureEnabled.value ? filters.value.billing_type : null, filters.value.billing_mode,
].filter((value) => value !== null && value !== undefined && value !== '').length)

const selectTab = (tab: 'usage' | 'errors') => {
  showColumnDropdown.value = false
  if (tab === 'errors') switchToErrors()
  else activeTab.value = 'usage'
}
const onTabKeydown = (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const tab = event.key === 'Home' ? 'usage' : event.key === 'End' ? 'errors' : activeTab.value === 'usage' ? 'errors' : 'usage'
  selectTab(tab)
  document.getElementById(`usage-tab-${tab}`)?.focus()
}
const retryRecords = () => activeTab.value === 'usage' ? loadLogs() : loadErrors()
const retryAnalysis = () => {
  if (statsError.value) void loadStats()
  if (modelStatsError.value) void loadModelStats()
  if (chartError.value) void loadChartData()
}

const filters = ref<UsageQueryParams>({
  start_date: startDate.value,
  end_date: endDate.value,
  request_type: undefined,
  native_compaction_v2: null,
  billing_type: null,
  billing_mode: null,
})

const pagination = reactive({
  page: 1,
  page_size: getPersistedPageSize(),
  total: 0,
})
const sortState = reactive({
  sort_by: 'created_at',
  sort_order: 'desc' as 'asc' | 'desc',
})

const granularityOptions = computed<SelectOption[]>(() => [
  { value: 'day', label: t('admin.dashboard.day') },
  { value: 'hour', label: t('admin.dashboard.hour') },
])
const requestTypeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allTypes') },
  { value: 'ws_v2', label: t('usage.ws') },
  { value: 'live', label: t('usage.live') },
  { value: 'stream', label: t('usage.stream') },
  { value: 'sync', label: t('usage.sync') },
])
const compactionOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.allCompactionTypes') },
  { value: true, label: t('usage.compactionOnly') },
])
// 订阅功能关闭后只剩余额计费，「计费类型」筛选（余额/订阅）失去意义，整块隐藏。
const subscriptionFeatureEnabled = computed(() => resolveFeatureFlag(appStore.cachedPublicSettings, FeatureFlags.subscription))
const billingTypeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allBillingTypes') },
  { value: 0, label: t('admin.usage.billingTypeBalance') },
  { value: 1, label: t('admin.usage.billingTypeSubscription') },
])
const billingModeOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allBillingModes') },
  { value: 'token', label: t('admin.usage.billingModeToken') },
  { value: 'per_request', label: t('admin.usage.billingModePerRequest') },
  { value: 'image', label: t('admin.usage.billingModeImage') },
  { value: 'video', label: t('admin.usage.billingModeVideo') },
])

const apiKeys = ref<ApiKey[]>([])
const groups = ref<Group[]>([])
const modelOptionValues = ref<string[]>([])

const apiKeyOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('usage.allApiKeys') },
  ...apiKeys.value.map((key) => ({ value: key.id, label: key.name })),
])
const groupOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allGroups') },
  ...groups.value.map((group) => ({ value: group.id, label: group.name })),
])
const modelOptions = computed<SelectOption[]>(() => [
  { value: null, label: t('admin.usage.allModels') },
  ...modelOptionValues.value.map((model) => ({ value: model, label: model })),
])

const normalizedFilters = computed<UsageQueryParams>(() => {
  const requestType = filters.value.request_type
  const legacyStream = requestType ? requestTypeToLegacyStream(requestType) : filters.value.stream
  return {
    ...filters.value,
    start_date: startDate.value,
    end_date: endDate.value,
    stream: legacyStream === null ? undefined : legacyStream,
  }
})

const buildUsageListParams = (page: number, pageSize: number): UsageQueryParams => ({
  page,
  page_size: pageSize,
  ...normalizedFilters.value,
  sort_by: sortState.sort_by,
  sort_order: sortState.sort_order,
})

const loadLogs = async () => {
  abortController?.abort()
  const controller = new AbortController()
  abortController = controller
  loading.value = true
  logsError.value = false
  try {
    const res = await usageAPI.query(buildUsageListParams(pagination.page, pagination.page_size), {
      signal: controller.signal,
    })
    if (!controller.signal.aborted) {
      usageLogs.value = res.items
      pagination.total = res.total
    }
  } catch (error: any) {
    if (!controller.signal.aborted && error?.name !== 'AbortError' && error?.code !== 'ERR_CANCELED') {
      logsError.value = true
    }
  } finally {
    if (abortController === controller) loading.value = false
  }
}

const loadStats = async () => {
  const seq = ++statsReqSeq
  endpointStatsLoading.value = true
  statsError.value = false
  try {
    const stats = await usageAPI.getStats(normalizedFilters.value)
    if (seq !== statsReqSeq) return
    usageStats.value = stats
    inboundEndpointStats.value = stats.endpoints || []
    upstreamEndpointStats.value = []
    endpointPathStats.value = []
  } catch (error) {
    if (seq !== statsReqSeq) return
    statsError.value = true
    console.error('Failed to load usage stats:', error)
    inboundEndpointStats.value = []
    upstreamEndpointStats.value = []
    endpointPathStats.value = []
  } finally {
    if (seq === statsReqSeq) endpointStatsLoading.value = false
  }
}

const loadModelStats = async () => {
  const seq = ++modelStatsReqSeq
  modelStatsLoading.value = true
  modelStatsError.value = false
  try {
    const response = await usageAPI.getDashboardModels({
      ...normalizedFilters.value,
      model_source: 'requested',
    })
    if (seq !== modelStatsReqSeq) return
    requestedModelStats.value = response.models || []
    refreshModelOptions(response.models || [])
  } catch (error) {
    if (seq !== modelStatsReqSeq) return
    modelStatsError.value = true
    console.error('Failed to load model stats:', error)
    requestedModelStats.value = []
  } finally {
    if (seq === modelStatsReqSeq) modelStatsLoading.value = false
  }
}

const loadChartData = async () => {
  const seq = ++chartReqSeq
  chartsLoading.value = true
  chartError.value = false
  try {
    const snapshot = await usageAPI.getDashboardSnapshotV2({
      ...normalizedFilters.value,
      granularity: granularity.value,
      include_trend: true,
      include_model_stats: false,
      include_group_stats: true,
    })
    if (seq !== chartReqSeq) return
    trendData.value = snapshot.trend || []
    groupStats.value = snapshot.groups || []
  } catch (error) {
    if (seq !== chartReqSeq) return
    chartError.value = true
    console.error('Failed to load chart data:', error)
    trendData.value = []
    groupStats.value = []
  } finally {
    if (seq === chartReqSeq) chartsLoading.value = false
  }
}

const refreshModelOptions = (models: ModelStat[]) => {
  const current = filters.value.model
  const set = new Set(modelOptionValues.value)
  models.forEach((item) => {
    if (item.model) set.add(item.model)
  })
  if (current) set.add(current)
  modelOptionValues.value = Array.from(set).sort()
}

const applyFilters = () => {
  pagination.page = 1
  void loadLogs()
  void loadStats()
  void loadModelStats()
  void loadChartData()
  resetErrorRows()
}

const refreshData = () => {
  void loadLogs()
  void loadStats()
  void loadModelStats()
  void loadChartData()
  if (activeTab.value === 'errors') void loadErrors()
}

const resetFilters = () => {
  const range = getLast24HoursRangeDates()
  startDate.value = range.start
  endDate.value = range.end
  filters.value = {
    start_date: range.start,
    end_date: range.end,
    request_type: undefined,
    native_compaction_v2: null,
    billing_type: null,
    billing_mode: null,
  }
  granularity.value = getGranularityForRange(range.start, range.end)
  errorFilter.value = { model: '', category: '', api_key_id: null, status_code: null }
  showAdvancedFilters.value = false
  applyFilters()
}

const onDateRangeChange = (range: { startDate: string; endDate: string; preset: string | null }) => {
  startDate.value = range.startDate
  endDate.value = range.endDate
  filters.value.start_date = range.startDate
  filters.value.end_date = range.endDate
  granularity.value = getGranularityForRange(range.startDate, range.endDate)
  applyFilters()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  void loadLogs()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize
  pagination.page = 1
  void loadLogs()
}

const handleSort = (key: string, order: 'asc' | 'desc') => {
  sortState.sort_by = key
  sortState.sort_order = order
  pagination.page = 1
  void loadLogs()
}

const handleIpGeoBatchFailed = () => {
  appStore.showError(t('usage.ipGeo.batchFailed'))
}

const getRequestTypeExportText = (log: UsageLog): string => {
  const requestType = resolveUsageRequestType(log)
  if (requestType === 'cyber') return 'Cyber'
  if (requestType === 'live') return 'Live'
  if (requestType === 'ws_v2') return 'WS'
  if (requestType === 'stream') return 'Stream'
  if (requestType === 'sync') return 'Sync'
  return 'Unknown'
}

const getDisplayBillingMode = (
  row: Pick<UsageLog, 'billing_mode' | 'image_count'> | null | undefined
): string | null | undefined => resolveDisplayBillingMode(row)

const escapeCSVValue = (value: unknown): string => {
  if (value == null) return ''
  const str = String(value)
  const escaped = str.replace(/"/g, '""')
  if (str === '-') return str
  if (/^[=+\-@\t\r]/.test(str)) return `"\'${escaped}"`
  if (/[,"\n\r]/.test(str)) return `"${escaped}"`
  return str
}

const exportToCSV = async () => {
  if (pagination.total === 0) {
    appStore.showWarning(t('usage.noDataToExport'))
    return
  }
  exporting.value = true
  appStore.showInfo(t('usage.preparingExport'))
  try {
    const allLogs: UsageLog[] = []
    const pageSize = 100
    const exportParams = buildUsageListParams(1, pageSize)
    const totalPages = Math.ceil(pagination.total / pageSize)
    for (let page = 1; page <= totalPages; page++) {
      const response = await usageAPI.query({ ...exportParams, page })
      allLogs.push(...response.items)
    }
    if (allLogs.length === 0) {
      appStore.showWarning(t('usage.noDataToExport'))
      return
    }
    const headers = [
      'Time',
      'API Key Name',
      'Model',
      'Reasoning Effort',
      'Inbound Endpoint',
      'IP Address',
      'Type',
      'Billing Mode',
      'Input Tokens',
      'Output Tokens',
      'Cache Read Tokens',
      'Cache Creation Tokens',
      'Rate Multiplier',
      'Billed Cost',
      'Original Cost',
      'First Token (ms)',
      'Duration (ms)',
    ]
    const rows = allLogs.map((log) => [
      log.created_at,
      log.api_key?.name || '',
      log.model,
      formatReasoningEffort(log.reasoning_effort),
      log.inbound_endpoint || '',
      log.ip_address || '',
      getRequestTypeExportText(log),
      getBillingModeLabel(getDisplayBillingMode(log), t),
      log.input_tokens,
      log.output_tokens,
      log.cache_read_tokens,
      log.cache_creation_tokens,
      log.rate_multiplier,
      log.actual_cost.toFixed(8),
      log.total_cost.toFixed(8),
      log.first_token_ms ?? '',
      log.duration_ms ?? '',
    ].map(escapeCSVValue))
    const csvContent = [
      headers.map(escapeCSVValue).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `usage_${exportParams.start_date}_to_${exportParams.end_date}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    appStore.showSuccess(t('usage.exportSuccess'))
  } catch (error) {
    console.error('CSV Export failed:', error)
    appStore.showError(t('usage.exportFailed'))
  } finally {
    exporting.value = false
  }
}

const ALWAYS_VISIBLE = ['created_at']
const DEFAULT_HIDDEN_COLUMNS = ['user_agent']
const HIDDEN_COLUMNS_KEY = 'user-usage-hidden-columns'

const allColumns = computed<Column[]>(() => [
  { key: 'api_key', label: t('usage.apiKeyFilter'), sortable: false },
  { key: 'model', label: t('usage.model'), sortable: true },
  { key: 'reasoning_effort', label: t('usage.reasoningEffort'), sortable: false },
  { key: 'endpoint', label: t('usage.endpoint'), sortable: false },
  { key: 'ip_address', label: 'IP', sortable: false },
  { key: 'group', label: t('admin.usage.group'), sortable: false },
  { key: 'stream', label: t('usage.type'), sortable: false },
  { key: 'billing_mode', label: t('admin.usage.billingMode'), sortable: false },
  { key: 'tokens', label: t('usage.tokens'), sortable: false },
  { key: 'cost', label: t('usage.cost'), sortable: false },
  { key: 'latency', label: t('usage.latency'), sortable: false },
  { key: 'created_at', label: t('usage.time'), sortable: true },
  { key: 'user_agent', label: t('usage.userAgent'), sortable: false },
])

const hiddenColumns = reactive<Set<string>>(new Set())
const toggleableColumns = computed(() => allColumns.value.filter((col) => !ALWAYS_VISIBLE.includes(col.key)))
const visibleColumns = computed(() =>
  allColumns.value.filter((col) => ALWAYS_VISIBLE.includes(col.key) || !hiddenColumns.has(col.key))
)
const isColumnVisible = (key: string) => !hiddenColumns.has(key)
const toggleColumn = (key: string) => {
  if (hiddenColumns.has(key)) hiddenColumns.delete(key)
  else hiddenColumns.add(key)
  localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify([...hiddenColumns]))
}
const loadSavedColumns = () => {
  try {
    const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY)
    const values = saved ? JSON.parse(saved) as string[] : DEFAULT_HIDDEN_COLUMNS
    values.forEach((key) => hiddenColumns.add(key))
  } catch {
    DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key))
  }
}

// 错误请求 tab 独立列设置(机制同用量列设置,存储互不影响)
const ERR_ALWAYS_VISIBLE = ['status', 'created_at']
const ERR_DEFAULT_HIDDEN_COLUMNS = ['user_agent']
const ERR_HIDDEN_COLUMNS_KEY = 'user-usage-error-hidden-columns'

// key 须与 UserErrorRequestsTable 的 allColumns 一致
const errAllColumns = computed<Column[]>(() => [
  { key: 'key_name', label: t('usage.errors.keyName') },
  { key: 'model', label: t('usage.errors.model') },
  { key: 'endpoint', label: t('usage.errors.endpoint') },
  { key: 'client_ip', label: 'IP' },
  { key: 'group', label: t('admin.usage.group') },
  { key: 'type', label: t('usage.type') },
  { key: 'platform', label: t('usage.errors.platform') },
  { key: 'category', label: t('usage.errors.category') },
  { key: 'status', label: t('usage.errors.status') },
  { key: 'message', label: t('usage.errors.message') },
  { key: 'created_at', label: t('usage.errors.time') },
  { key: 'user_agent', label: t('usage.userAgent') },
])

const errHiddenColumns = reactive<Set<string>>(new Set())
const errToggleableColumns = computed(() =>
  errAllColumns.value.filter((col) => !ERR_ALWAYS_VISIBLE.includes(col.key))
)
const errVisibleColumnKeys = computed(() =>
  errAllColumns.value
    .filter((col) => ERR_ALWAYS_VISIBLE.includes(col.key) || !errHiddenColumns.has(col.key))
    .map((col) => col.key)
)
const isErrColumnVisible = (key: string) => !errHiddenColumns.has(key)
const toggleErrColumn = (key: string) => {
  if (errHiddenColumns.has(key)) errHiddenColumns.delete(key)
  else errHiddenColumns.add(key)
  localStorage.setItem(ERR_HIDDEN_COLUMNS_KEY, JSON.stringify([...errHiddenColumns]))
}
const loadSavedErrColumns = () => {
  try {
    const saved = localStorage.getItem(ERR_HIDDEN_COLUMNS_KEY)
    const values = saved ? (JSON.parse(saved) as string[]) : ERR_DEFAULT_HIDDEN_COLUMNS
    values.forEach((key) => errHiddenColumns.add(key))
  } catch {
    ERR_DEFAULT_HIDDEN_COLUMNS.forEach((key) => errHiddenColumns.add(key))
  }
}

// 列设置下拉按当前 tab 分发
const currentToggleableColumns = computed(() =>
  activeTab.value === 'errors' ? errToggleableColumns.value : toggleableColumns.value
)
const isCurrentColumnVisible = (key: string) =>
  activeTab.value === 'errors' ? isErrColumnVisible(key) : isColumnVisible(key)
const toggleCurrentColumn = (key: string) => {
  if (activeTab.value === 'errors') toggleErrColumn(key)
  else toggleColumn(key)
}

const showColumnDropdown = ref(false)
const columnDropdownRef = ref<HTMLElement | null>(null)
const closeColumnDropdown = () => {
  showColumnDropdown.value = false
  columnDropdownRef.value?.querySelector<HTMLButtonElement>('button')?.focus()
}
const handleColumnClickOutside = (event: MouseEvent) => {
  if (columnDropdownRef.value && !columnDropdownRef.value.contains(event.target as HTMLElement)) {
    showColumnDropdown.value = false
  }
}

const loadApiKeys = async () => {
  const firstPage = await keysAPI.list(1, 100)
  const keys = [...firstPage.items]
  for (let page = 2; page <= firstPage.pages && keys.length > 0; page++) {
    const response = await keysAPI.list(page, 100)
    if (response.items.length === 0) break
    keys.push(...response.items)
  }
  return keys
}

const loadFilterOptions = async () => {
  try {
    const [keys, availableGroups] = await Promise.all([
      loadApiKeys(),
      userGroupsAPI.getAvailable(),
    ])
    apiKeys.value = keys
    groups.value = availableGroups
  } catch (error) {
    console.error('Failed to load usage filter options:', error)
  }
}

const resetErrorRows = () => {
  errorPage.value = 1
  if (activeTab.value === 'errors') {
    void loadErrors()
  } else {
    errorRows.value = []
    errorTotal.value = 0
  }
}

const loadErrors = async () => {
  const seq = ++errorReqSeq
  errorLoading.value = true
  errorsError.value = false
  try {
    const resp = await usageAPI.listMyErrorRequests({
      page: errorPage.value,
      page_size: errorPageSize.value,
      start_date: startDate.value,
      end_date: endDate.value,
      model: (errorFilter.value.model ?? '').trim() || undefined,
      category: errorFilter.value.category || undefined,
      api_key_id: errorFilter.value.api_key_id ?? undefined,
      status_code: errorFilter.value.status_code ?? undefined,
      sort_by: errorSortBy.value,
      sort_order: errorSortOrder.value,
    })
    if (seq !== errorReqSeq) return
    errorRows.value = resp.items
    errorTotal.value = resp.total
  } catch (error) {
    if (seq !== errorReqSeq) return
    errorsError.value = true
    console.error('[UsageView] loadErrors failed:', error)
  } finally {
    if (seq === errorReqSeq) errorLoading.value = false
  }
}

const onErrorSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
  errorSortBy.value = sortBy
  errorSortOrder.value = sortOrder
  errorPage.value = 1
  void loadErrors()
}

const onErrorPage = (page: number) => {
  errorPage.value = page
  void loadErrors()
}

const onErrorPageSize = (pageSize: number) => {
  errorPageSize.value = pageSize
  errorPage.value = 1
  void loadErrors()
}

const switchToErrors = () => {
  activeTab.value = 'errors'
  if (errorRows.value.length === 0) void loadErrors()
}

onMounted(() => {
  loadSavedColumns()
  loadSavedErrColumns()
  document.addEventListener('click', handleColumnClickOutside)
  void loadFilterOptions()
  refreshData()
})

onUnmounted(() => {
  abortController?.abort()
  errorReqSeq++
  statsReqSeq++
  modelStatsReqSeq++
  chartReqSeq++
  document.removeEventListener('click', handleColumnClickOutside)
})

watch(errorViewEnabled, (enabled) => {
  if (!enabled) activeTab.value = 'usage'
})
</script>

<style scoped>
.usage-workspace { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.usage-period, .usage-period-field { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.usage-period { justify-content: space-between; }
.usage-period-field { color: var(--ws-muted); font-size: 13px; }
.usage-granularity { justify-content: flex-end; margin-bottom: 16px; }
.usage-granularity > :last-child { width: 112px; }
.usage-detail { min-width: 0; }
.usage-records { overflow: hidden; border-radius: 0 0 10px 10px; }
.usage-records :deep(.usage-api-key) { display: block; max-width: 200px; white-space: normal; overflow-wrap: anywhere; }
.usage-detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--ws-border); }
.usage-detail-heading h2 { padding: 16px 0; font-size: 15px; font-weight: 600; }
.usage-tabs { display: flex; gap: 24px; min-width: 0; }
.usage-tabs button { padding: 16px 0; border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--ws-muted); font-weight: 500; }
.usage-tabs button:hover, .usage-tabs button.is-active { color: var(--ws-action); }
.usage-tabs button.is-active { border-bottom-color: var(--ws-action); }
.usage-record-count { color: var(--ws-muted); font-size: 12px; flex-shrink: 0; }
.usage-filter-area { padding: 20px; border-bottom: 1px solid var(--ws-border); }
.usage-filters { display: flex; flex-direction: column; gap: 16px; }
.usage-filter-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.usage-error-filters { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.usage-filter-field { min-width: 0; }
.usage-advanced-grid { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; padding-top: 16px; border-top: 1px solid var(--ws-border); }
.usage-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.usage-actions > :last-child { margin-left: auto; }
.usage-filter-count { padding: 0 6px; border-radius: 4px; background: var(--ws-selected); color: var(--ws-action); }
.usage-feedback { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 20px; color: var(--ws-muted); background: var(--ws-surface); border: 1px solid var(--ws-border); border-radius: 8px; }
.usage-record-error { margin: 20px; }
.usage-feedback button { flex-shrink: 0; }
.usage-period .btn, .usage-actions .btn { gap: 6px; }
@media (max-width: 767px) {
  .usage-filter-grid, .usage-advanced-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 479px) {
  .usage-workspace { gap: 16px; }
  .usage-period { align-items: stretch; }
  .usage-period-field { width: 100%; justify-content: space-between; }
  .usage-period > button { width: 100%; justify-content: center; }
  .usage-detail-heading { padding: 0 16px; }
  .usage-tabs { gap: 16px; }
  .usage-filter-area { padding: 16px; }
  .usage-filter-grid, .usage-advanced-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .usage-actions > :last-child { margin-left: 0; }
  .usage-record-error { margin: 16px; }
}
</style>
