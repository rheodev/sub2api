import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave, routerKey } from 'vue-router'

/** Keep drafts in memory; never persist credentials or silently submit a form. */
export function useUnsavedChanges(readDraft: () => unknown, ready: Ref<boolean>) {
  const baseline = ref<string | null>(null)
  const current = computed(() => JSON.stringify(readDraft()))
  const dirty = computed(() => ready.value && baseline.value !== null && current.value !== baseline.value)
  const showLeaveDialog = ref(false)
  let resolveLeave: ((leave: boolean) => void) | undefined

  async function markSaved() {
    await nextTick()
    baseline.value = current.value
  }

  watch(ready, value => { if (value) void markSaved() }, { immediate: true })

  function confirmLeave(leave: boolean) {
    showLeaveDialog.value = false
    resolveLeave?.(leave)
    resolveLeave = undefined
  }

  if (inject(routerKey, null)) {
    onBeforeRouteLeave(() => {
      if (!dirty.value) return true
      // A second navigation cancels the first pending request.
      resolveLeave?.(false)
      showLeaveDialog.value = true
      return new Promise<boolean>(resolve => { resolveLeave = resolve })
    })
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (!dirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', beforeUnload)
    resolveLeave?.(false)
  })

  return { dirty, showLeaveDialog, confirmLeave, markSaved }
}
