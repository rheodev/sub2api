<template>
  <Teleport to="body">
    <div class="toast-container pointer-events-none fixed left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-message pointer-events-auto flex w-fit max-w-full items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm dark:border-dark-600 dark:bg-dark-800 dark:text-gray-100"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
          @pointerenter="pauseOnHover($event, toast.id)"
          @pointerleave="resumeOnLeave($event, toast.id)"
          @focusin="appStore.pauseToast(toast.id)"
          @focusout="resumeWhenIdle($event, toast.id)"
        >
          <Icon
            :name="appearance[toast.type].icon"
            size="md"
            :class="['mt-0.5 shrink-0', appearance[toast.type].color]"
            aria-hidden="true"
          />
          <div class="toast-content min-w-0 flex-1 overflow-y-auto text-sm leading-6">
            <p v-if="toast.title" class="font-semibold">{{ toast.title }}</p>
            <p class="whitespace-pre-wrap [overflow-wrap:anywhere]" :class="{ 'text-gray-600 dark:text-gray-300': toast.title }">
              {{ toast.message }}
            </p>
          </div>
          <button
            type="button"
            class="-my-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white"
            :aria-label="t('common.close')"
            @click="appStore.hideToast(toast.id)"
          >
            <Icon name="x" size="sm" aria-hidden="true" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useAppStore } from '@/stores/app'
import type { ToastType } from '@/types'

const appStore = useAppStore()
const { t } = useI18n()
const toasts = computed(() => appStore.toasts)
const hoveredToasts = new WeakSet<HTMLElement>()

const appearance: Record<ToastType, {
  icon: 'checkCircle' | 'xCircle' | 'exclamationTriangle' | 'infoCircle'
  color: string
}> = {
  success: { icon: 'checkCircle', color: 'text-emerald-700 dark:text-emerald-400' },
  error: { icon: 'xCircle', color: 'text-red-600 dark:text-red-400' },
  warning: { icon: 'exclamationTriangle', color: 'text-amber-700 dark:text-amber-400' },
  info: { icon: 'infoCircle', color: 'text-blue-600 dark:text-blue-400' }
}

function pauseOnHover(event: PointerEvent, id: string): void {
  if (event.pointerType !== 'mouse') return
  hoveredToasts.add(event.currentTarget as HTMLElement)
  appStore.pauseToast(id)
}

function resumeOnLeave(event: PointerEvent, id: string): void {
  if (event.pointerType !== 'mouse') return
  hoveredToasts.delete(event.currentTarget as HTMLElement)
  resumeWhenIdle(event, id)
}

function resumeWhenIdle(event: Event, id: string): void {
  const target = event.currentTarget as HTMLElement
  // Focus has not moved yet during focusout; inspect its destination instead.
  const nextFocus = (event as FocusEvent).relatedTarget
  const focused = event.type === 'focusout'
    ? nextFocus instanceof Node && target.contains(nextFocus)
    : target.contains(document.activeElement)
  if (!hoveredToasts.has(target) && !focused) appStore.resumeToast(id)
}
</script>

<style scoped>
.toast-container {
  top: calc(env(safe-area-inset-top, 0px) + 16px);
  width: min(440px, calc(100% - 32px));
}

.toast-content {
  max-height: min(216px, calc(28dvh - 24px));
}

.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.toast-leave-active {
  position: absolute;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
}
</style>
