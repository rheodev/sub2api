import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

import HomeView from '../HomeView.vue'

const { getModelPlaza, appStore, authStore } = vi.hoisted(() => ({
  getModelPlaza: vi.fn().mockResolvedValue({ groups: [] }),
  appStore: {
    cachedPublicSettings: {} as Record<string, unknown>,
    siteName: 'Fallback site',
    siteLogo: '',
    docUrl: '',
    publicSettingsLoaded: true,
    fetchPublicSettings: vi.fn(),
  },
  authStore: {
    isAuthenticated: false,
    isAdmin: false,
    user: null as { email?: string } | null,
    checkAuth: vi.fn(),
  },
}))

vi.mock('@/api/modelPlaza', () => ({ getModelPlaza }))

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
  useAuthStore: () => authStore,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStore,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  }
})

function mountHome(settings: Record<string, unknown> = {}) {
  appStore.cachedPublicSettings = {
    site_name: 'Test site',
    site_subtitle: 'Test subtitle',
    ...settings,
  }

  return mount(HomeView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        LocaleSwitcher: { template: '<div data-testid="locale-switcher" />' },
        Icon: { template: '<span data-testid="icon" />' },
      },
    },
  })
}

function compactDestination(wrapper: ReturnType<typeof mountHome>) {
  return wrapper.get('.landing-hero-links').findComponent(RouterLinkStub).props('to')
}

function modelPlazaDestination(wrapper: ReturnType<typeof mountHome>) {
  return wrapper
    .findAllComponents(RouterLinkStub)
    .find((link) => link.props('to') === '/model-plaza')
    ?.props('to')
}

describe('HomeView compact mode', () => {
  beforeEach(() => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    authStore.user = null
    authStore.checkAuth.mockClear()
    appStore.fetchPublicSettings.mockClear()
    localStorage.clear()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  })

  it('renders custom HTML ahead of compact mode', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      home_content: '<section id="custom-home">Custom home</section>',
    })

    expect(wrapper.get('#custom-home').text()).toBe('Custom home')
    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
  })

  it('renders custom URL content ahead of compact mode', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      home_content: ' https://example.com/home ',
    })

    expect(wrapper.get('iframe').attributes('src')).toBe('https://example.com/home')
    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
  })

  it('treats whitespace-only custom content as empty and selects compact mode', () => {
    const wrapper = mountHome({ compact_home_enabled: true, home_content: ' \n\t ' })

    expect(wrapper.get('[data-testid="compact-home"]').text()).toContain('Test site')
  })

  it.each([undefined, false])('selects the default home when compact mode is %s', (enabled) => {
    const settings = enabled === undefined ? {} : { compact_home_enabled: enabled }
    const wrapper = mountHome(settings)

    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
    expect(wrapper.find('.welcome-studio').exists()).toBe(true)
  })

  it('links unauthenticated visitors to login', () => {
    expect(compactDestination(mountHome({ compact_home_enabled: true }))).toBe('/login')
  })

  it('links authenticated users to their dashboard', () => {
    authStore.isAuthenticated = true

    expect(compactDestination(mountHome({ compact_home_enabled: true }))).toBe('/dashboard')
  })

  it('links administrators to the admin dashboard', () => {
    authStore.isAuthenticated = true
    authStore.isAdmin = true

    const wrapper = mountHome({ compact_home_enabled: true })
    expect(compactDestination(wrapper)).toBe('/admin/dashboard')
    expect(authStore.checkAuth).toHaveBeenCalledOnce()
    expect(appStore.fetchPublicSettings).not.toHaveBeenCalled()
  })

  it('shows the model plaza link to anonymous visitors when public access is enabled', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('hides the model plaza link from anonymous visitors when sign-in is required', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: true,
    })

    expect(modelPlazaDestination(wrapper)).toBeUndefined()
  })

  it('shows the model plaza link to authenticated visitors when sign-in is required', () => {
    authStore.isAuthenticated = true

    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: true,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('shows the model plaza link in the default home header', () => {
    const wrapper = mountHome({
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('hides the model plaza link when the feature is disabled', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: false,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBeUndefined()
  })
})

describe('HomeView user experience', () => {
  beforeEach(() => {
    authStore.isAuthenticated = false
    getModelPlaza.mockReset().mockResolvedValue({ groups: [] })
  })

  it('replaces factory branding and technical copy while preserving custom branding', () => {
    const wrapper = mountHome({ site_name: 'Sub2API', site_subtitle: 'Subscription to API Conversion Platform' })
    expect(wrapper.text()).toContain('portal.defaultName')
    expect(wrapper.text()).not.toContain('Subscription to API')
    expect(wrapper.find('pre').exists()).toBe(false)
    expect(wrapper.find('a[href*="github.com"]').exists()).toBe(false)
    wrapper.unmount()
    const custom = mountHome({ site_name: 'My AI', site_subtitle: 'My introduction' })
    expect(custom.text()).toContain('My AI')
    expect(custom.text()).toContain('My introduction')
    custom.unmount()
  })

  it('supports keyboard selection of user scenarios', async () => {
    const wrapper = mountHome()
    await wrapper.get('#scenario-tab-writing').trigger('keydown', { key: 'End' })
    expect(wrapper.get('#scenario-tab-learning').attributes('aria-selected')).toBe('true')
    await wrapper.get('#scenario-tab-learning').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('#scenario-tab-writing').attributes('aria-selected')).toBe('true')
    expect(wrapper.findAll('[role="tab"][tabindex="0"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('loads only enabled, permitted model previews and deduplicates model names', async () => {
    const hidden = mountHome({ model_plaza_enabled: true, model_plaza_require_auth: true })
    await flushPromises()
    expect(getModelPlaza).not.toHaveBeenCalled()
    hidden.unmount()
    getModelPlaza.mockResolvedValue({ groups: [{ models: [{ name: 'Model A' }, { name: 'Model A' }, { name: 'Model B' }] }] })
    const wrapper = mountHome({ model_plaza_enabled: true })
    await flushPromises()
    expect(wrapper.findAll('.welcome-model-row')).toHaveLength(2)
    wrapper.unmount()
  })

  it('offers a retry after a model preview failure and keeps other content usable', async () => {
    getModelPlaza.mockRejectedValueOnce(new Error('unavailable'))
    const wrapper = mountHome({ model_plaza_enabled: true })
    await flushPromises()
    expect(wrapper.text()).toContain('portal.modelsFailed')
    getModelPlaza.mockResolvedValue({ groups: [] })
    await wrapper.get('.welcome-model-status button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('portal.modelsEmpty')
    wrapper.unmount()
  })

  it('hides subscriptions when disabled and sends anonymous service entries to login', () => {
    const wrapper = mountHome({ subscription_enabled: false })
    expect(wrapper.text()).not.toContain('portal.subscriptionTitle')
    for (const link of wrapper.get('.welcome-service-grid').findAllComponents(RouterLinkStub)) expect(link.props('to')).toBe('/login')
    wrapper.unmount()
  })
})
