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
<div class="settings-content">
        <SettingsSecuritySection />
        <SettingsGatewaySection />
        <SettingsUsersSection />
        <SettingsGeneralSection />
	        <SettingsAgreementSection />
        <SettingsFeaturesSection />
        <SettingsPaymentSection />

        <SettingsEmailSection />
        <SettingsBackupSection />
        <div v-show="activeTab !== 'backup'" class="flex justify-end">
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
      </div>
</form>
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
import { defineComponent, provide } from 'vue'
import { useSystemSettings, systemSettingsComponents } from './useSystemSettings'
import { systemSettingsKey } from './settings/context'
import SettingsSecuritySection from './settings/sections/SettingsSecuritySection.vue'
import SettingsGatewaySection from './settings/sections/SettingsGatewaySection.vue'
import SettingsUsersSection from './settings/sections/SettingsUsersSection.vue'
import SettingsGeneralSection from './settings/sections/SettingsGeneralSection.vue'
import SettingsAgreementSection from './settings/sections/SettingsAgreementSection.vue'
import SettingsFeaturesSection from './settings/sections/SettingsFeaturesSection.vue'
import SettingsPaymentSection from './settings/sections/SettingsPaymentSection.vue'
import SettingsEmailSection from './settings/sections/SettingsEmailSection.vue'
import SettingsBackupSection from './settings/sections/SettingsBackupSection.vue'
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
