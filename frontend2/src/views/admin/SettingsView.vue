<template>


  <AppLayout>
    <div class="settings-page">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"
        ></div>
      </div>
      <form v-else @submit.prevent="saveSettings" class="settings-workspace" novalidate>
        <SettingsNavigation />
<fieldset :disabled="saving" class="settings-content min-w-0">
        <SettingsSecuritySection v-if="visitedSettingsTabs.has('security')" />
        <SettingsGatewaySection v-if="visitedSettingsTabs.has('gateway')" />
        <SettingsUsersSection v-if="visitedSettingsTabs.has('users')" />
        <SettingsGeneralSection />
	        <SettingsAgreementSection v-if="visitedSettingsTabs.has('agreement')" />
        <SettingsFeaturesSection v-if="visitedSettingsTabs.has('features')" />
        <SettingsPaymentSection v-if="visitedSettingsTabs.has('payment')" />

        <SettingsEmailSection v-if="visitedSettingsTabs.has('email')" />
        <SettingsBackupSection v-if="visitedSettingsTabs.has('backup')" />
        <div v-show="activeTab !== 'backup'" class="settings-save-bar">
          <p role="status" class="text-sm text-gray-500 dark:text-gray-400">{{ settingsDirty ? t('workspace.unsavedChanges') : t('workspace.settingsUpToDate') }}</p>
          <button
            type="submit"
            :disabled="saving || loadFailed"
            class="btn btn-primary"
          >
            <svg
              v-if="saving"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{
              saving
                ? t("admin.settings.saving")
                : t("admin.settings.saveSettings")
            }}
          </button>
        </div>
      </fieldset>
</form>
      <ConfirmDialog
        :show="showLeaveDialog"
        :title="t('workspace.unsavedChanges')"
        :message="t('workspace.leaveSettingsMessage')"
        :confirm-text="t('workspace.discardChanges')"
        :cancel-text="t('workspace.keepEditing')"
        danger
        @confirm="confirmLeave(true)"
        @cancel="confirmLeave(false)"
      />
      <PaymentProviderDialog
        ref="providerDialogRef"
        :show="showProviderDialog"
        :saving="providerSaving"
        :editing="editingProvider"
        :all-key-options="providerKeyOptions"
        :enabled-key-options="enabledProviderKeyOptions"
        :all-payment-types="allPaymentTypes"
        :redirect-label="t('admin.settings.payment.easypayRedirect')"
        @close="showProviderDialog = false"
        @save="handleSaveProvider"
      />
      <ConfirmDialog
        :show="showDeleteProviderDialog"
        :title="t('admin.settings.payment.deleteProvider')"
        :message="t('admin.settings.payment.deleteProviderConfirm')"
        :confirm-text="t('common.delete')"
        danger
        @confirm="handleDeleteProvider"
        @cancel="showDeleteProviderDialog = false"
      />
      <ConfirmDialog
        :show="affiliateConfirmDialog.show"
        :title="affiliateConfirmDialog.title"
        :message="affiliateConfirmDialog.message"
        :confirm-text="affiliateConfirmDialog.confirmText"
        danger
        @confirm="handleAffiliateConfirm"
        @cancel="cancelAffiliateConfirm"
      />
      <TotpStepUpDialog :controller="settingsStepUp" />
    </div>
  </AppLayout>

</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, provide } from 'vue'
import { useSystemSettings, systemSettingsComponents } from './useSystemSettings'
import { systemSettingsKey } from './settings/context'
const SettingsSecuritySection = defineAsyncComponent(() => import('./settings/sections/SettingsSecuritySection.vue'))
const SettingsGatewaySection = defineAsyncComponent(() => import('./settings/sections/SettingsGatewaySection.vue'))
const SettingsUsersSection = defineAsyncComponent(() => import('./settings/sections/SettingsUsersSection.vue'))
import SettingsGeneralSection from './settings/sections/SettingsGeneralSection.vue'
const SettingsAgreementSection = defineAsyncComponent(() => import('./settings/sections/SettingsAgreementSection.vue'))
const SettingsFeaturesSection = defineAsyncComponent(() => import('./settings/sections/SettingsFeaturesSection.vue'))
const SettingsPaymentSection = defineAsyncComponent(() => import('./settings/sections/SettingsPaymentSection.vue'))
const SettingsEmailSection = defineAsyncComponent(() => import('./settings/sections/SettingsEmailSection.vue'))
const SettingsBackupSection = defineAsyncComponent(() => import('./settings/sections/SettingsBackupSection.vue'))
import SettingsNavigation from './settings/sections/SettingsNavigation.vue'

export default defineComponent({
  name: 'SettingsView',
  components: { ...systemSettingsComponents, SettingsSecuritySection, SettingsGatewaySection, SettingsUsersSection, SettingsGeneralSection, SettingsAgreementSection, SettingsFeaturesSection, SettingsPaymentSection, SettingsEmailSection, SettingsBackupSection, SettingsNavigation },
  setup() {
    const state = useSystemSettings()
    provide(systemSettingsKey, state)
    return state
  },
})
</script>
