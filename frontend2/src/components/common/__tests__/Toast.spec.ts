import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import Toast from '../Toast.vue'

describe('Toast 交互计时', () => {
  let wrapper: ReturnType<typeof mount>
  let store: ReturnType<typeof useAppStore>

  beforeEach(async () => {
    vi.useFakeTimers()
    const pinia = createPinia()
    store = useAppStore(pinia)
    wrapper = mount(Toast, {
      attachTo: document.body,
      global: { plugins: [pinia, createI18n({
        legacy: false,
        locale: 'zh',
        messages: { zh: { common: { close: () => '关闭' } } }
      })] }
    })
    store.showSuccess('保存成功', 3000)
    await nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
    store.$dispose()
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  function pointer(type: string, pointerType: string) {
    const event = new Event(type)
    Object.defineProperty(event, 'pointerType', { value: pointerType })
    document.querySelector('.toast-message')!.dispatchEvent(event)
  }

  it('触屏模拟悬停不暂停自动关闭', () => {
    pointer('pointerenter', 'touch')
    document.querySelector('.toast-message')!.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(3000)
    expect(store.toasts).toHaveLength(0)
  })

  it('鼠标悬停暂停，离开后继续剩余时间', () => {
    vi.advanceTimersByTime(1000)
    pointer('pointerenter', 'mouse')
    vi.advanceTimersByTime(5000)
    expect(store.toasts).toHaveLength(1)
    pointer('pointerleave', 'mouse')
    vi.advanceTimersByTime(1999)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts).toHaveLength(0)
  })

  it('鼠标离开时键盘仍聚焦则保持暂停，失焦后恢复', () => {
    pointer('pointerenter', 'mouse')
    document.querySelector<HTMLButtonElement>('.toast-message button')!.focus()
    pointer('pointerleave', 'mouse')
    vi.advanceTimersByTime(5000)
    expect(store.toasts).toHaveLength(1)
    document.querySelector<HTMLButtonElement>('.toast-message button')!.blur()
    vi.advanceTimersByTime(3000)
    expect(store.toasts).toHaveLength(0)
  })
})
