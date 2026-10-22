<template>
  <AppLayout>
    <div data-testid="profile-shell" class="profile-workspace">
      <ProfileInfoCard :user="user" :oidc-provider-name="oidcOAuthProviderName" />

      <div class="profile-tabs" role="tablist" :aria-label="t('profile.title')">
        <button v-for="(tab, index) in tabs" :id="`profile-tab-${tab.id}`" :key="tab.id"
          type="button" role="tab" :aria-selected="activeTab === tab.id"
          :aria-controls="`profile-panel-${tab.id}`" :tabindex="activeTab === tab.id ? 0 : -1"
          @click="activeTab = tab.id" @keydown="handleTabKeydown($event, index)">
          {{ tab.label }}
        </button>
      </div>

      <div id="profile-panel-basics" v-show="activeTab === 'basics'" role="tabpanel"
        aria-labelledby="profile-tab-basics" tabindex="0">
        <section data-testid="profile-basics-panel" class="card">
          <div class="profile-section-heading">
            <h2>{{ t('profile.basicsTitle') }}</h2>
            <p>{{ t('profile.basicsDescription') }}</p>
          </div>
          <div class="profile-basics-grid">
            <ProfileAvatarCard :user="user" embedded />
            <ProfileEditForm :initial-username="user?.username || ''" embedded />
          </div>
        </section>
      </div>

      <div id="profile-panel-security" v-show="activeTab === 'security'" role="tabpanel"
        aria-labelledby="profile-tab-security" tabindex="0" class="space-y-6">
        <div class="profile-security-grid">
          <ProfilePasswordForm />
          <div class="min-w-0 space-y-6">
            <ProfileTotpCard />
            <ProfilePasskeyCard :enabled="passkeyEnabled" />
          </div>
        </div>
        <div data-testid="profile-auth-bindings-panel">
          <ProfileIdentityBindingsSection :user="user" :linuxdo-enabled="linuxdoOAuthEnabled"
            :dingtalk-enabled="dingtalkOAuthEnabled" :oidc-enabled="oidcOAuthEnabled"
            :oidc-provider-name="oidcOAuthProviderName" :wechat-enabled="wechatOAuthEnabled"
            :wechat-open-enabled="wechatOAuthOpenEnabled" :wechat-mp-enabled="wechatOAuthMPEnabled" compact />
        </div>
      </div>

      <div v-if="balanceLowNotifyEnabled" id="profile-panel-notifications"
        v-show="activeTab === 'notifications'" role="tabpanel"
        aria-labelledby="profile-tab-notifications" tabindex="0">
        <ProfileBalanceNotifyCard v-if="user"
          :enabled="user.balance_notify_enabled ?? true" :threshold="user.balance_notify_threshold"
          :extra-emails="user.balance_notify_extra_emails ?? []"
          :system-default-threshold="systemDefaultThreshold" :user-email="user.email" />
      </div>

      <aside v-if="contactInfo" class="profile-support">
        <Icon name="chat" size="sm" class="shrink-0" />
        <div class="min-w-0">
          <h2>{{ t('common.contactSupport') }}</h2>
          <p>{{ contactInfo }}</p>
        </div>
      </aside>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@/components/icons'
import AppLayout from '@/components/layout/AppLayout.vue'
import ProfileBalanceNotifyCard from '@/components/user/profile/ProfileBalanceNotifyCard.vue'
import ProfileAvatarCard from '@/components/user/profile/ProfileAvatarCard.vue'
import ProfileEditForm from '@/components/user/profile/ProfileEditForm.vue'
import ProfileIdentityBindingsSection from '@/components/user/profile/ProfileIdentityBindingsSection.vue'
import ProfileInfoCard from '@/components/user/profile/ProfileInfoCard.vue'
import ProfilePasswordForm from '@/components/user/profile/ProfilePasswordForm.vue'
import ProfileTotpCard from '@/components/user/profile/ProfileTotpCard.vue'
import ProfilePasskeyCard from '@/components/user/profile/ProfilePasskeyCard.vue'
import { isWeChatWebOAuthEnabled } from '@/api/auth'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const contactInfo = ref('')
const balanceLowNotifyEnabled = ref(false)
const systemDefaultThreshold = ref(0)
const linuxdoOAuthEnabled = ref(false)
const dingtalkOAuthEnabled = ref(false)
const wechatOAuthEnabled = ref(false)
const wechatOAuthOpenEnabled = ref<boolean | undefined>(undefined)
const wechatOAuthMPEnabled = ref<boolean | undefined>(undefined)
const oidcOAuthEnabled = ref(false)
const oidcOAuthProviderName = ref('OIDC')
const passkeyEnabled = ref(false)
const activeTab = ref('basics')
const tabs = computed(() => [
  { id: 'basics', label: t('profile.tabs.basics') },
  { id: 'security', label: t('profile.tabs.security') },
  ...(balanceLowNotifyEnabled.value ? [{ id: 'notifications', label: t('profile.tabs.notifications') }] : [])
])

function handleTabKeydown(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.value.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.value.length) % tabs.value.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.value.length - 1
  else return
  event.preventDefault()
  activeTab.value = tabs.value[next].id
  const button = event.currentTarget as HTMLButtonElement
  button.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
}

onMounted(async () => {
  const profileRefresh = authStore.refreshUser().catch((error) => {
    console.error('Failed to refresh profile:', error)
  })

  const settingsLoad = appStore.fetchPublicSettings()
    .then((settings) => {
      if (!settings) {
        return
      }
      contactInfo.value = settings.contact_info || ''
      balanceLowNotifyEnabled.value = settings.balance_low_notify_enabled ?? false
      systemDefaultThreshold.value = settings.balance_low_notify_threshold ?? 0
      linuxdoOAuthEnabled.value = settings.linuxdo_oauth_enabled ?? false
      dingtalkOAuthEnabled.value = settings.dingtalk_oauth_enabled ?? false
      wechatOAuthEnabled.value = isWeChatWebOAuthEnabled(settings)
      wechatOAuthOpenEnabled.value = typeof settings.wechat_oauth_open_enabled === 'boolean'
        ? settings.wechat_oauth_open_enabled
        : undefined
      wechatOAuthMPEnabled.value = typeof settings.wechat_oauth_mp_enabled === 'boolean'
        ? settings.wechat_oauth_mp_enabled
        : undefined
      oidcOAuthEnabled.value = settings.oidc_oauth_enabled ?? false
      oidcOAuthProviderName.value = settings.oidc_oauth_provider_name || 'OIDC'
      passkeyEnabled.value = settings.passkey_enabled === true
    })
    .catch((error) => {
      console.error('Failed to load settings:', error)
    })

  await Promise.all([profileRefresh, settingsLoad])
})
</script>

<style scoped>
.profile-workspace { width: 100%; max-width: 1100px; margin-inline: auto; }
.profile-tabs { display: flex; gap: 24px; margin: 24px 0; border-bottom: 1px solid var(--ws-border); }
.profile-tabs button { padding: 0 0 12px; border-bottom: 2px solid transparent; font-size: 14px; font-weight: 500; color: var(--ws-muted); }
.profile-tabs button:hover { color: var(--ws-text); }
.profile-tabs button[aria-selected='true'] { border-bottom-color: var(--ws-action); color: var(--ws-action); }
.profile-section-heading { padding: 20px 24px; border-bottom: 1px solid var(--ws-border); }
.profile-section-heading h2, .profile-workspace :deep(.card:not(.profile-overview) h2) { font-size: 15px; font-weight: 600; color: var(--ws-text); }
.profile-section-heading p { margin-top: 4px; font-size: 13px; color: var(--ws-muted); }
.profile-basics-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.profile-basics-grid > :deep(div) { min-width: 0; padding: 24px; }
.profile-basics-grid > :deep(div + div) { border-left: 1px solid var(--ws-border); }
.profile-security-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); align-items: start; gap: 24px; }
.profile-support { display: flex; align-items: flex-start; gap: 12px; margin-top: 24px; padding: 16px 0; color: var(--ws-muted); font-size: 13px; border-top: 1px solid var(--ws-border); }
.profile-support h2 { font-weight: 500; color: var(--ws-text); }
.profile-support p { margin-top: 4px; white-space: pre-line; overflow-wrap: anywhere; }
@media (max-width: 767px) {
  .profile-basics-grid, .profile-security-grid { grid-template-columns: minmax(0, 1fr); }
  .profile-basics-grid > :deep(div + div) { border-left: 0; border-top: 1px solid var(--ws-border); }
  .profile-basics-grid > :deep(div), .profile-section-heading { padding: 20px; }
  .profile-tabs { gap: 20px; }
}
</style>
