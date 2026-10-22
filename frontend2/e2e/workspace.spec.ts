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

async function prepare(page: Page, role?: string, dark = false, populated = false, overrides: Record<string, unknown> = {}) {
  const publicSettings = { ...settings, ...overrides }
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
  }, { currentUser, role, settings: publicSettings, dark })
  await page.route('**/setup/status', route => route.fulfill({ json: { code: 0, data: { needs_setup: false } } }))
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
    let data: unknown = {}
    if (path === '/auth/me') data = currentUser
    else if (path === '/settings/public' || path === '/admin/settings') data = publicSettings
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
  await expect(page.locator('.welcome-studio')).toBeVisible()
  await expect(page.locator('h1')).toContainText('找到适合你的 AI')
  await expect(page.locator('body')).not.toContainText('Subscription to API')
  await expect(page.locator('pre')).toHaveCount(0)
  await page.getByRole('tab', { name: '编程辅助', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toContainText('复杂的问题')
  await page.getByRole('tab', { name: '编程辅助', exact: true }).press('End')
  await expect(page.getByRole('tab', { name: '学习研究', exact: true })).toBeFocused()
  await expect(page.getByRole('tabpanel')).toContainText('好奇心')
  await page.getByRole('tab', { name: '内容创作', exact: true }).click()
  await capture(page, 'home', info.project.name)
  await page.getByRole('button', { name: '切换到深色模式' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await capture(page, 'home-dark', info.project.name)
  await page.locator('.landing-hero-links a').first().click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await capture(page, 'login', info.project.name)
})

test('table density changes rendered spacing and persists after reload', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Mobile uses record cards instead of table cells')
  await prepare(page, 'user', false, true)
  await page.goto('/keys')
  const header = page.locator('.table-wrapper th').first()
  const cell = page.locator('.table-wrapper tbody td').first()
  const row = page.locator('.table-wrapper tbody tr').first()
  const button = page.locator('.workspace-density')

  await expect(cell).toHaveCSS('padding-top', '16px')
  await expect(header).toHaveCSS('padding-top', '16px')
  const standardHeight = (await row.boundingBox())!.height
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(cell).toHaveCSS('padding-top', '7px')
  await expect(cell).toHaveCSS('padding-bottom', '7px')
  await expect(header).toHaveCSS('padding-top', '9px')
  await expect(header).toHaveCSS('padding-bottom', '9px')
  expect((await row.boundingBox())!.height).toBeLessThan(standardHeight)

  await page.reload()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(cell).toHaveCSS('padding-top', '7px')
  await expect(header).toHaveCSS('padding-top', '9px')
  await capture(page, 'keys-density-compact', info.project.name)

  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await expect(cell).toHaveCSS('padding-top', '16px')
  await expect(cell).toHaveCSS('padding-bottom', '16px')
  await expect(header).toHaveCSS('padding-top', '16px')
  await expect(header).toHaveCSS('padding-bottom', '16px')
  await capture(page, 'keys-density-standard', info.project.name)
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
  // Lazy account creation must initialize on its first mount and reopen cleanly.
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole('button', { name: '添加账号', exact: true }).first().click()
    const dialog = page.getByRole('dialog', { name: '添加账号', exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'OpenAI', exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Close modal', exact: true }).click()
    await expect(dialog).toHaveCount(0)
  }
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

test('profile sections preserve drafts and adapt to theme and viewport', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await prepare(page, 'user', false, false, {
    balance_low_notify_enabled: true, balance_low_notify_threshold: 5,
  })
  let english = false
  // The dev server may inject real settings into HTML after the init script.
  await page.route('**/profile', async route => {
    const response = await route.fetch()
    let body = (await response.text()).replace(/<script>window\.__APP_CONFIG__=.*?;<\/script>/s, '')
    if (english) body = body.replace('</head>', '<script>localStorage.setItem("sub2api_locale", "en")</script></head>')
    await route.fulfill({ response, body })
  })
  await page.route('**/api/v1/user/totp/status*', route => route.fulfill({ json: {
    code: 0, data: { enabled: false, feature_enabled: true },
  } }))
  await page.goto('/profile')
  const username = page.getByRole('textbox', { name: '用户名', exact: true })
  await expect(username).toHaveValue('Preview User')
  await username.fill('尚未保存的用户名')
  await capture(page, 'profile-basics', info.project.name)
  await page.getByRole('tab', { name: '账号安全', exact: true }).click()
  const password = page.getByLabel('当前密码', { exact: true })
  await password.fill('local-unsaved-draft')
  await expect(page.getByRole('heading', { name: '修改密码', exact: true })).toBeVisible()
  await capture(page, 'profile-security', info.project.name)
  await page.getByRole('tab', { name: '通知设置', exact: true }).click()
  await expect(page.locator('#balance-notify-threshold')).toBeVisible()
  await page.locator('#balance-notify-threshold').fill('12')
  await capture(page, 'profile-notifications', info.project.name)
  await page.getByRole('tab', { name: '基础资料', exact: true }).click()
  await expect(username).toHaveValue('尚未保存的用户名')
  await page.getByRole('tab', { name: '基础资料', exact: true }).press('ArrowRight')
  await expect(page.getByRole('tab', { name: '账号安全', exact: true })).toBeFocused()
  await expect(password).toHaveValue('local-unsaved-draft')
  await page.getByRole('tab', { name: '账号安全', exact: true }).press('End')
  await expect(page.locator('#balance-notify-threshold')).toHaveValue('12')
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await capture(page, 'profile-notifications-dark', info.project.name)
  await page.getByRole('tab', { name: '基础资料', exact: true }).click()
  await capture(page, 'profile-basics-dark', info.project.name)

  english = true
  const longUser = {
    ...user, username: 'LongDisplayName'.repeat(6),
    email: `${'long-address-'.repeat(5)}@example.com`, email_bound: true,
  }
  await page.route('**/api/v1/auth/me*', route => route.fulfill({ json: { code: 0, data: longUser } }))
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 900, height: 1000 })
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Username', exact: true })).toHaveValue(longUser.username)
  await expect(page.locator('[data-testid="profile-overview-hero"]')).toContainText(longUser.email)
  await capture(page, 'profile-basics-english-long', info.project.name)
  await page.getByRole('tab', { name: 'Security', exact: true }).click()
  await capture(page, 'profile-security-english-narrow', info.project.name)
  expect(errors).toEqual([])
})

test('redemption feedback, history retry and paging work across viewports', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await prepare(page, 'user')
  let english = false
  await page.route('**/redeem', async route => {
    if (route.request().resourceType() !== 'document') return route.fallback()
    const response = await route.fetch()
    let body = (await response.text()).replace(/<script>window\.__APP_CONFIG__=.*?;<\/script>/s, '')
    if (english) body = body.replace('</head>', '<script>localStorage.setItem("sub2api_locale", "en")</script></head>')
    await route.fulfill({ response, body })
  })
  const currentUser = { ...user }
  await page.route('**/api/v1/auth/me*', route => route.fulfill({ json: { code: 0, data: currentUser } }))
  let failHistory = true
  let history = Array.from({ length: 21 }, (_, index) => ({
    id: index + 1, code: `PREVIEW-CODE-${index}`, type: ['balance', 'admin_balance', 'subscription'][index % 3],
    value: index % 3 === 1 ? -5 : 30, used_at: timestamp, validity_days: 30,
    group: { id: 1, name: '团队订阅 / Team subscription with a long group name' },
    notes: index === 1 ? '管理员调整余额 / Account balance adjustment' : '',
  }))
  const receivedCodes: string[] = []
  await page.route(/\/api\/v1\/redeem(?:\/history)?(?:\?|$)/, async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/history')) {
      if (failHistory) {
        failHistory = false
        return route.fulfill({ status: 503, json: { code: 503, message: 'History unavailable' } })
      }
      const pageNumber = Number(url.searchParams.get('page') || 1)
      const size = Number(url.searchParams.get('page_size') || 20)
      return route.fulfill({ json: { code: 0, data: {
        items: history.slice((pageNumber - 1) * size, pageNumber * size), total: history.length,
        page: pageNumber, page_size: size, pages: Math.ceil(history.length / size),
      } } })
    }
    const code = route.request().postDataJSON().code as string
    receivedCodes.push(code)
    if (code === 'INVALID') return route.fulfill({ status: 400, json: { code: 400, message: '兑换码已使用，请检查后重试。' } })
    const type = code.toLowerCase()
    if (type === 'balance') currentUser.balance += 20
    if (type === 'concurrency') currentUser.concurrency += 2
    history.unshift({
      id: 100 + receivedCodes.length, code, type, value: type === 'concurrency' ? 2 : 20,
      used_at: timestamp, validity_days: 30, group: { id: 1, name: '团队订阅' }, notes: '',
    })
    return route.fulfill({ json: { code: 0, data: {
      type, value: type === 'concurrency' ? 2 : 20, message: '兑换已到账',
      new_balance: currentUser.balance, new_concurrency: currentUser.concurrency,
      group_name: '团队订阅', validity_days: 30,
    } } })
  })
  await page.goto('/redeem')
  const input = page.getByRole('textbox', { name: '兑换码', exact: true })
  const submit = page.getByRole('button', { name: '兑换', exact: true })
  await expect(submit).toBeDisabled()
  await input.fill('   ')
  await expect(submit).toBeDisabled()
  await expect(page.locator('.redeem-history [role="alert"]')).toBeVisible()
  await page.getByRole('button', { name: '请重试', exact: true }).click()
  await expect(page.locator('.redeem-history-row')).toHaveCount(20)
  await page.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(page.locator('.redeem-history-row')).toHaveCount(1)
  await page.getByRole('button', { name: '上一页', exact: true }).click()
  await page.locator('.redeem-page-size select').selectOption('50')
  await expect(page.locator('.redeem-history-row')).toHaveCount(21)
  history = history.slice(0, 3)
  await page.reload()
  await expect(page.locator('.redeem-history-row')).toHaveCount(3)
  await input.fill('INVALID')
  await submit.click()
  await expect(page.locator('#redeem-error')).toContainText('兑换码已使用')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Close notification', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Close notification', exact: true })).toHaveCount(0)
  await capture(page, 'redeem-error', info.project.name)
  for (const code of ['BALANCE', 'CONCURRENCY', 'SUBSCRIPTION']) {
    await input.fill(` ${code} `)
    await submit.click()
    await expect(page.locator('.redeem-feedback-success')).toContainText('兑换已到账')
    await expect(input).toHaveValue('')
    await expect(page.locator('.redeem-feedback-success')).toContainText(code === 'BALANCE' ? '$62.50' : code === 'CONCURRENCY' ? '7' : '团队订阅')
    await page.getByRole('button', { name: 'Close notification', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Close notification', exact: true })).toHaveCount(0)
  }
  expect(receivedCodes).toEqual(['INVALID', 'BALANCE', 'CONCURRENCY', 'SUBSCRIPTION'])
  await expect(page.locator('.redeem-history-row')).toHaveCount(6)
  await capture(page, 'redeem-success', info.project.name)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await capture(page, 'redeem-success-dark', info.project.name)
  english = true
  await page.setViewportSize({ width: info.project.name === 'mobile' ? 320 : 900, height: 1000 })
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Redeem Code', exact: true })).toBeVisible()
  await capture(page, 'redeem-english-narrow', info.project.name)
  history = []
  await page.reload()
  await expect(page.locator('.redeem-empty')).toContainText('Your redemption history will appear here')
  await capture(page, 'redeem-empty', info.project.name)
  expect(errors).toEqual([])
})

test('settings drafts survive tab changes and cancelled navigation', async ({ page }, info) => {
  await prepare(page, 'admin')
  await page.goto('/admin/settings')
  const name = page.getByRole('textbox', { name: '站点名称', exact: true })
  await expect(name).toHaveValue('Sub2API')
  await name.fill('Unsaved workspace')
  await page.locator('#settings-tab-security').click()
  await expect(page.getByRole('switch', { name: '开放注册', exact: true })).toBeVisible()
  await page.locator('#settings-tab-general').click()
  await expect(name).toHaveValue('Unsaved workspace')
  async function navigate() {
    if (info.project.name === 'mobile') await page.locator('header button.lg\\:hidden').first().click()
    await page.locator('aside a[href="/admin/accounts"]').click()
  }
  await navigate()
  if (info.project.name === 'mobile') {
    await expect(page.locator('aside')).toHaveAttribute('inert', '')
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'))).toBe(true)
  }
  await page.getByRole('button', { name: '继续编辑', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/settings/)
  await expect(name).toHaveValue('Unsaved workspace')
  await navigate()
  await page.getByRole('button', { name: '放弃更改并离开', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/accounts/)
})

test('mobile navigation traps focus and restores the trigger', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile')
  await prepare(page, 'admin')
  await page.goto('/keys')
  const trigger = page.locator('header button.lg\\:hidden').first()
  await trigger.click()
  await expect(page.locator('aside')).toHaveAttribute('aria-modal', 'true')
  const last = page.locator('aside button[aria-label="关闭"]')
  await last.focus()
  await page.keyboard.press('Tab')
  await expect(page.locator('aside a').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(page.locator('aside')).toHaveAttribute('inert', '')
})
