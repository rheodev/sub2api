import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore, useAuthStore, useAdminSettingsStore } from '@/stores'
import { resolveRouteMetaKeys } from '@/router/title'
import { resolveSiteBillingMode } from '@/utils/siteBillingMode'

export function usePageHeading() {
  const route = useRoute()
  const { t } = useI18n()
  const app = useAppStore()
  const auth = useAuthStore()
  const admin = useAdminSettingsStore()
  const keys = computed(() => resolveRouteMetaKeys(route, {
    billingMode: resolveSiteBillingMode(app.cachedPublicSettings),
  }))
  const pageTitle = computed(() => {
    if (route.name === 'CustomPage') {
      const items = [...(app.cachedPublicSettings?.custom_menu_items ?? []),
        ...(auth.isAdmin ? admin.customMenuItems : [])]
      const item = items.find(item => item.id === route.params.id)
      if (item?.label) return item.label
    }
    return keys.value.titleKey ? t(keys.value.titleKey) : String(route.meta.title || '')
  })
  const pageDescription = computed(() => keys.value.descriptionKey
    ? t(keys.value.descriptionKey) : String(route.meta.description || ''))
  return { pageTitle, pageDescription }
}
