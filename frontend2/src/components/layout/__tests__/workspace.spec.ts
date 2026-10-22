import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it } from 'vitest'
import PageHeading from '../PageHeading.vue'
import { useAppStore, useAuthStore, useAdminSettingsStore } from '@/stores'

describe('workspace page heading', () => {
  const wrappers: ReturnType<typeof mount>[] = []
  afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))

  async function setup() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/custom/:id', name: 'CustomPage', component: { template: '<div />' } },
      { path: '/keys', meta: { titleKey: 'keys.title', descriptionKey: 'keys.description' }, component: { template: '<div />' } },
    ] })
    const i18n = createI18n({ legacy: false, locale: 'zh', messages: {
      zh: { keys: { title: () => 'API 密钥', description: () => '管理密钥' } },
      en: { keys: { title: () => 'API Keys', description: () => 'Manage keys' } },
    } })
    await router.push('/keys')
    const wrapper = mount(PageHeading, { global: { plugins: [pinia, router, i18n] } })
    wrappers.push(wrapper)
    return { wrapper, router, i18n }
  }

  it('updates heading and description when the language changes', async () => {
    const { wrapper, i18n } = await setup()
    expect(wrapper.get('h1').text()).toBe('API 密钥')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('API Keys')
    expect(wrapper.get('p').text()).toBe('Manage keys')
  })

  it('uses public custom-page labels and does not expose admin labels to ordinary users', async () => {
    const { wrapper, router } = await setup()
    const app = useAppStore()
    app.cachedPublicSettings = { custom_menu_items: [{ id: 'guide', label: '接入指南' }] } as never
    await router.push('/custom/guide')
    expect(wrapper.get('h1').text()).toBe('接入指南')
    useAdminSettingsStore().customMenuItems = [{ id: 'private', label: '内部资料' }] as never
    await router.push('/custom/private')
    expect(wrapper.text()).not.toContain('内部资料')
    useAuthStore().user = { role: 'admin' } as never
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('内部资料')
  })
})
