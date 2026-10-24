import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AnnouncementBell from '../AnnouncementBell.vue'
import { useAnnouncementStore } from '@/stores/announcements'

const { markRead, showError, showSuccess } = vi.hoisted(() => ({ markRead: vi.fn(), showError: vi.fn(), showSuccess: vi.fn() }))
vi.mock('@/api', () => ({ announcementsAPI: { markRead, list: vi.fn().mockResolvedValue([{ id: 1, title: 'Notice', content: 'Details', notify_mode: 'silent', created_at: '2026-09-30', updated_at: '2026-09-30' }]) } }))
vi.mock('@/stores/app', () => ({ useAppStore: () => ({ showError, showSuccess }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/format', () => ({ formatRelativeTime: () => 'now', formatRelativeWithDateTime: () => 'now' }))
enableAutoUnmount(afterEach)
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  useAnnouncementStore().announcements = [{ id: 1, title: 'Notice', content: 'Details', notify_mode: 'silent', created_at: '2026-09-30', updated_at: '2026-09-30' }]
})
afterEach(() => { vi.restoreAllMocks(); document.body.style.overflow = '' })

describe('announcement read confirmation', () => {
  it('prevents another read submission while opening a notice is still marking it read', async () => {
    let finish!: () => void
    markRead.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const wrapper = mount(AnnouncementBell, { global: { stubs: { Teleport: true, Transition: true, Icon: true } } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    await wrapper.get('.announcement-row').trigger('click')
    const confirm = wrapper.findAll('button').find(button => button.text() === 'announcements.markingRead')!
    expect(confirm.attributes('disabled')).toBeDefined()
    await confirm.trigger('click')
    expect(markRead).toHaveBeenCalledTimes(1)
    finish()
    await flushPromises()
    expect(wrapper.text()).toContain('announcements.readStatus')
    expect(useAnnouncementStore().unreadCount).toBe(0)
  })

  it('keeps a failed read confirmation open and only reports success after retry', async () => {
    markRead.mockRejectedValue(new Error('offline'))
    const wrapper = mount(AnnouncementBell, { global: { stubs: { Teleport: true, Transition: true, Icon: true } } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    await wrapper.get('.announcement-row').trigger('click')
    await flushPromises()
    const confirm = () => wrapper.findAll('button').find(button => button.text() === 'announcements.markRead')!
    await confirm().trigger('click')
    await flushPromises()
    expect(markRead).toHaveBeenCalledTimes(2)
    expect(showSuccess).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toBe('announcements.readFailed')
    expect(wrapper.find('.markdown-body').exists()).toBe(true)
    markRead.mockResolvedValue(undefined)
    await confirm().trigger('click')
    await flushPromises()
    expect(showSuccess).toHaveBeenCalledWith('announcements.markedAsRead')
    expect(wrapper.find('.markdown-body').exists()).toBe(false)
    expect(useAnnouncementStore().unreadCount).toBe(0)
  })
})
