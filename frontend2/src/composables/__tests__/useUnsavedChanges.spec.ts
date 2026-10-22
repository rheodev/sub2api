import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { useUnsavedChanges } from '../useUnsavedChanges'

async function setup() {
  const draft = ref('loaded')
  const ready = ref(false)
  let guard!: ReturnType<typeof useUnsavedChanges>
  const Editor = defineComponent({ setup() {
    guard = useUnsavedChanges(() => draft.value, ready)
    return () => h('input')
  } })
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: Editor }, { path: '/other', component: { render: () => h('p', 'other') } },
  ] })
  await router.push('/')
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await router.isReady()
  ready.value = true
  await flushPromises()
  return { draft, ready, guard, router, wrapper }
}

describe('useUnsavedChanges', () => {
  it('establishes the loaded baseline and recognizes a reverted edit', async () => {
    const { draft, guard, wrapper } = await setup()
    expect(guard.dirty.value).toBe(false)
    draft.value = 'changed'
    expect(guard.dirty.value).toBe(true)
    draft.value = 'loaded'
    expect(guard.dirty.value).toBe(false)
    wrapper.unmount()
  })
  it('keeps a draft when navigation is cancelled, then discards only on confirmation', async () => {
    const { draft, guard, router, wrapper } = await setup()
    draft.value = 'changed'
    const cancelled = router.push('/other')
    await flushPromises()
    expect(guard.showLeaveDialog.value).toBe(true)
    guard.confirmLeave(false)
    await cancelled
    expect(router.currentRoute.value.path).toBe('/')
    expect(draft.value).toBe('changed')
    const leaving = router.push('/other')
    await flushPromises()
    guard.confirmLeave(true)
    await leaving
    expect(router.currentRoute.value.path).toBe('/other')
    wrapper.unmount()
  })
  it('warns on browser exit only while dirty and clears the warning after saving', async () => {
    const { draft, guard, wrapper } = await setup()
    draft.value = 'changed'
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await guard.markSaved()
    await nextTick()
    expect(guard.dirty.value).toBe(false)
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)
    wrapper.unmount()
  })
})
