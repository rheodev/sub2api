import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

// Synthetic local responses validate UI behavior; no production credentials or payment calls.
const user = { id: 91, email: 'preview@example.com', username: 'Preview User', role: 'user', status: 'active', balance: 42.5, concurrency: 5, created_at: '2026-01-01T00:00:00Z' }
const timestamp = '2026-01-01T00:00:00Z'
const sampleKeys = [1, 2].map(id => ({ id, user_id: 91, key: `sk-local-preview-${id}`, name: id === 1 ? 'Preview production API — 主业务与数据分析工作空间' : 'Preview development API', group_id: null, status: 'active', quota: 100, quota_used: 12.5, current_concurrency: 0, ip_whitelist: [], ip_blacklist: [], expires_at: null, last_used_at: null, created_at: timestamp, updated_at: timestamp, rate_limit_5h: 0, rate_limit_1d: 0, rate_limit_7d: 0, usage_5h: 0, usage_1d: 0, usage_7d: 0 }))
const sampleAccounts = [1, 2].map(id => ({ id, name: id === 1 ? 'Preview upstream — 长名称生产账户与团队协作环境' : 'Preview sandbox', platform: 'anthropic', type: 'apikey', credentials: { base_url: 'https://api.example.com' }, credentials_status: { has_api_key: true }, extra: {}, proxy_id: null, concurrency: 5, current_concurrency: 0, priority: 1, rate_multiplier: 1, status: 'active', error_message: null, last_used_at: null, expires_at: null, auto_pause_on_expired: true, created_at: timestamp, updated_at: timestamp, groups: [], group_ids: [], schedulable: true, account_groups: [] }))
const settings = {
  site_name: 'Sub2API', site_subtitle: '统一接入，专注创造。', site_logo: '', home_content: '',
  registration_enabled: true, password_reset_enabled: true, email_verify_enabled: false,
  custom_menu_items: [], custom_endpoints: [], table_default_page_size: 20, table_page_size_options: [10, 20, 50, 100],
  subscription_enabled: true, payment_enabled: false, model_plaza_enabled: true,
  channel_monitor_enabled: true, channel_monitor_default_interval_seconds: 60, version: 'preview',
}

async function prepare(page: Page, role?: string, dark = false, populated = false) {
  const currentUser = { ...user, role: role || 'user' }
  await page.addInitScript(({ currentUser, role, settings, dark }) => {
    localStorage.setItem('sub2api_locale', 'zh')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    if (role) {
      localStorage.setItem('auth_token', 'local-ui-test')
      localStorage.setItem('auth_user', JSON.stringify(currentUser))
      localStorage.setItem(`${role === 'admin' ? 'admin' : 'user'}_guide_91_${role}_v4_interactive`, 'true')
    }
    Object.assign(window, { __APP_CONFIG__: settings })
  }, { currentUser, role, settings, dark })
  await page.route('**/setup/status', route => route.fulfill({ json: { code: 0, data: { needs_setup: false } } }))
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    let data: unknown = {}
    if (path === '/auth/me') data = currentUser
    else if (path === '/settings/public' || path === '/admin/settings') data = settings
    else if (path === '/admin/compliance') data = { required: false }
    else if (path.endsWith('/all') || path.includes('/subscriptions/active') || path.includes('/announcements') || path.includes('/oauth/providers') || path === '/admin/payment/providers' || path === '/groups/available') data = []
    else if (path === '/usage/dashboard/stats') data = { total_api_keys: 3, active_api_keys: 2, today_requests: 128, total_requests: 2048, today_actual_cost: 0.125, today_cost: 0.25, total_actual_cost: 4.5, total_cost: 9, today_tokens: 18000, total_tokens: 256000, rpm: 12, tpm: 3500, average_duration_ms: 1420, by_platform: [] }
    else if (path === '/usage/dashboard/api-keys-usage') data = { stats: {} }
    else if (path.endsWith('/trend')) data = { trend: [] }
    else if (path.endsWith('/models')) data = { models: [] }
    else if (path.includes('platform-quotas')) data = { platform_quotas: [] }
    else if (populated && (path === '/keys' || path === '/admin/accounts')) {
      const items = path === '/keys' ? sampleKeys : sampleAccounts
      data = { items, total: items.length, page: 1, page_size: 20, pages: 1 }
    }
    else if (path === '/keys' || path === '/usage' || path === '/admin/accounts' || path === '/admin/proxies') data = { items: [], total: 0, page: 1, page_size: 20, pages: 0 }
    else if (path.includes('email-templates')) data = { events: [], locales: [], placeholders: [] }
    else if (path === '/admin/backups/image-storage') data = { config: { prefix: 'images/' } }
    else if (path === '/admin/backups') data = { items: [] }
    else if (path.includes('beta-policy')) data = { rules: [] }
    else if (path.includes('web-search')) data = { enabled: false, providers: [] }
    else if (path.includes('/payment/config')) data = { enabled: false, providers: [], payment_methods: [] }
    else if (path.includes('/system/')) data = { current_version: 'preview', latest_version: 'preview', has_update: false }
    await route.fulfill({ json: { code: 0, data } })
  })
}

async function capture(page: Page, name: string, project: string) {
  await mkdir('.impeccable/review', { recursive: true })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `.impeccable/review/${name}-${project}.png`, fullPage: true, animations: 'disabled' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

test('homepage, theme and login navigation', async ({ page }, info) => {
  await prepare(page)
  await page.goto('/home')
  await expect(page.locator('.landing-protocol')).toBeVisible()
  await capture(page, 'home', info.project.name)
  await page.getByRole('button', { name: '切换到深色模式' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await capture(page, 'home-dark', info.project.name)
  await page.locator('.landing-hero-links a').first().click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await capture(page, 'login', info.project.name)
})

test('user dashboard, density persistence and API-key dialog', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await prepare(page, 'user')
  await page.goto('/dashboard')
  await expect(page.locator('.dashboard-metrics')).toBeVisible()
  await capture(page, 'dashboard', info.project.name)
  await page.goto('/keys')
  await expect(page.locator('.workspace-heading h1')).toBeVisible()
  await page.locator('.workspace-density').click()
  await expect(page.locator('html')).toHaveAttribute('data-table-density', 'compact')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-table-density', 'compact')
  await expect(page.locator('[data-tour="keys-create-btn"]')).toBeVisible()
  await capture(page, 'keys', info.project.name)
  await page.locator('[data-tour="keys-create-btn"]').first().click()
  await expect(page.locator('[data-tour="key-form-name"]')).toBeVisible()
  await capture(page, 'key-dialog', info.project.name)
  const closeButton = page.getByRole('button', { name: 'Close modal' })
  await closeButton.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('.modal-footer button').last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(closeButton).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-tour="keys-create-btn"]')).toBeFocused()
  expect(errors).toEqual([])
})

test('administrator settings sections and account management', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await prepare(page, 'admin', true)
  await page.goto('/admin/settings')
  await expect(page.locator('.settings-tab').first()).toBeVisible()
  await expect(page.locator('.settings-section:visible input').first()).toHaveValue('Sub2API')
  await expect(page.locator('.border-red-500')).toHaveCount(0)
  await capture(page, 'settings-dark', info.project.name)
  for (const section of ['security', 'users', 'gateway', 'features', 'email', 'payment', 'backup', 'agreement', 'general']) {
    await page.locator(`#settings-tab-${section}`).click()
    await expect(page.locator(`#settings-tab-${section}`)).toHaveAttribute('aria-selected', 'true')
  }
  await page.goto('/admin/accounts')
  await expect(page.locator('.workspace-heading h1')).toBeVisible()
  await capture(page, 'accounts-dark', info.project.name)
  expect(errors).toEqual([])
})

test('unauthenticated users cannot enter management', async ({ page }) => {
  await prepare(page)
  await page.goto('/admin/settings')
  await expect(page).toHaveURL(/\/login/)
})


test('populated records, keyboard sorting and mobile sorting', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await prepare(page, 'admin', false, true)
  await page.goto('/keys')
  await expect(page.getByText(sampleKeys[0].name, { exact: true })).toBeVisible()
  if (info.project.name === 'mobile') {
    const sortField = page.getByLabel('排序', { exact: true })
    await sortField.selectOption('name')
    await expect(sortField).toHaveValue('name')
    await page.getByRole('button', { name: '升序', exact: true }).click()
    await expect(page.getByRole('button', { name: '降序', exact: true })).toBeVisible()
  } else {
    const sortButton = page.getByRole('columnheader', { name: '名称', exact: true }).getByRole('button')
    await sortButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('columnheader', { name: '名称', exact: true })).toHaveAttribute('aria-sort', 'ascending')
    await page.keyboard.press('Space')
    await expect(page.getByRole('columnheader', { name: '名称', exact: true })).toHaveAttribute('aria-sort', 'descending')
  }
  await capture(page, 'keys-populated', info.project.name)
  await page.goto('/admin/accounts')
  await expect(page.getByText(sampleAccounts[0].name, { exact: true })).toBeVisible()
  await capture(page, 'accounts-populated', info.project.name)
  expect(errors).toEqual([])
})
