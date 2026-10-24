<template>
  <button
    ref="bellRef"
    type="button"
    class="announcement-bell"
    :aria-label="unreadCount ? t('announcements.bellUnread', { count: unreadCount }) : t('announcements.title')"
    :aria-expanded="isModalOpen"
    aria-haspopup="dialog"
    @click="openModal"
  >
    <Icon name="bell" size="md" />
    <span v-if="unreadCount" class="announcement-dot" aria-hidden="true" />
  </button>

  <BaseDialog
    :show="isModalOpen"
    :title="selectedAnnouncement?.title || t('announcements.title')"
    :close-label="selectedAnnouncement ? t('announcements.backToList') : t('common.close')"
    width="wide"
    :z-index="100"
    close-on-click-outside
    @close="handleClose"
  >
    <section v-if="selectedAnnouncement" ref="detailRef" tabindex="-1" class="announcement-detail">
      <div class="announcement-meta">
        <time :datetime="selectedAnnouncement.created_at">{{ formatRelativeWithDateTime(selectedAnnouncement.created_at) }}</time>
        <span :class="['badge', selectedAnnouncement.read_at ? 'badge-gray' : 'badge-primary']">{{ t(selectedAnnouncement.read_at ? 'announcements.read' : 'announcements.unread') }}</span>
      </div>
      <div class="markdown-body announcement-content" v-html="renderedContent" />
      <p v-if="readError" class="announcement-error-text" role="alert">{{ t('announcements.readFailed') }}</p>
      <p v-else class="announcement-read-status" role="status">{{ t(readPending ? 'announcements.markingRead' : selectedAnnouncement.read_at ? 'announcements.readStatus' : 'announcements.markReadHint') }}</p>
    </section>
    <section v-else ref="listRef" class="announcement-list" :aria-busy="loading || markingAll">
      <div class="announcement-toolbar">
        <span role="status">{{ t('announcements.listSummary', { count: announcements.length, unread: unreadCount }) }}</span>
        <div class="announcement-toolbar-actions">
          <button ref="refreshRef" type="button" class="btn btn-secondary btn-sm" :disabled="loading || markingAll || !!readPending" :aria-label="t('common.refresh')" @click="refreshAnnouncements">
            <Icon name="refresh" size="sm" :class="{ 'animate-spin': loading && !markingAll }" />
          </button>
          <button v-if="unreadCount" type="button" class="btn btn-secondary btn-sm" :disabled="loading || markingAll || !!readPending" @click="markAllAsRead">{{ t(markingAll ? 'announcements.markingRead' : 'announcements.markAllRead') }}</button>
        </div>
      </div>
      <div v-if="loadError" class="announcement-error" role="alert">
        <p>{{ t(announcements.length ? 'announcements.refreshFailed' : 'announcements.loadFailed') }}</p>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="loading || markingAll" @click="refreshAnnouncements">{{ t('announcements.retry') }}</button>
      </div>
      <p v-if="batchError" class="announcement-error-text" role="alert">{{ t('announcements.markAllFailed') }}</p>
      <div v-if="loading && !markingAll && !announcements.length" class="announcement-empty" role="status">{{ t('common.loading') }}</div>
      <ul v-else-if="announcements.length" class="announcement-rows">
        <li v-for="item in announcements" :key="item.id">
          <button :ref="el => setRowRef(item.id, el)" type="button" class="announcement-row" :class="{ 'is-unread': !item.read_at }" :disabled="loading || markingAll || !!readPending" @click="openDetail(item)">
            <span class="announcement-row-content">
              <span class="announcement-row-title">{{ item.title }}</span>
              <span class="announcement-meta">
                <time :datetime="item.created_at" :title="formatRelativeWithDateTime(item.created_at)">{{ formatRelativeTime(item.created_at) }}</time>
                <span :class="['badge', item.read_at ? 'badge-gray' : 'badge-primary']">{{ t(item.read_at ? 'announcements.read' : 'announcements.unread') }}</span>
              </span>
            </span>
            <Icon name="chevronRight" size="sm" />
          </button>
        </li>
      </ul>
      <div v-else-if="!loadError" class="announcement-empty">
        <Icon name="inbox" size="xl" />
        <h4>{{ t('announcements.empty') }}</h4>
        <p>{{ t('announcements.emptyDescription') }}</p>
      </div>
    </section>
    <template #footer>
      <div class="announcement-footer">
        <template v-if="selectedAnnouncement">
          <button type="button" class="btn btn-secondary" @click="closeDetail"><Icon name="chevronLeft" size="sm" />{{ t('announcements.backToList') }}</button>
          <button v-if="!selectedAnnouncement.read_at" type="button" class="btn btn-primary" :disabled="!!readPending" @click="markAsReadAndClose(selectedAnnouncement.id)">{{ t(readPending ? 'announcements.markingRead' : 'announcements.markRead') }}</button>
        </template>
        <button v-else ref="listCloseRef" type="button" class="btn btn-secondary" @click="closeModal">{{ t('common.close') }}</button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAppStore } from '@/stores/app'
import { useAnnouncementStore } from '@/stores/announcements'
import { formatRelativeTime, formatRelativeWithDateTime } from '@/utils/format'
import type { UserAnnouncement } from '@/types'
import Icon from '@/components/icons/Icon.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import '@/styles/announcement-markdown.css'

const { t } = useI18n()
const appStore = useAppStore()
const announcementStore = useAnnouncementStore()
const { announcements, loading, loadError, unreadCount } = storeToRefs(announcementStore)
const isModalOpen = ref(false)
const selectedAnnouncement = ref<UserAnnouncement | null>(null)
const markingAll = ref(false)
const readPending = ref<number | null>(null)
const readError = ref(false)
const batchError = ref(false)
const bellRef = ref<HTMLButtonElement | null>(null)
const refreshRef = ref<HTMLButtonElement | null>(null)
const detailRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const listCloseRef = ref<HTMLButtonElement | null>(null)
const rowRefs = new Map<number, HTMLButtonElement>()
let listScrollTop = 0
const renderedContent = computed(() => {
  const content = document.createElement('template')
  content.innerHTML = DOMPurify.sanitize(marked.parse(selectedAnnouncement.value?.content || '', { breaks: true, gfm: true }) as string)
  content.content.querySelectorAll('table').forEach(table => {
    const wrapper = document.createElement('div')
    wrapper.className = 'announcement-table-scroll'
    wrapper.tabIndex = 0
    wrapper.setAttribute('role', 'region')
    wrapper.setAttribute('aria-label', t('announcements.tableContent'))
    table.replaceWith(wrapper)
    wrapper.append(table)
  })
  return content.innerHTML
})

function setRowRef(id: number, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLButtonElement) rowRefs.set(id, element)
  else rowRefs.delete(id)
}

function openModal() {
  isModalOpen.value = true
  batchError.value = false
  if (!loading.value) announcementStore.fetchAnnouncements()
}

function closeModal() {
  isModalOpen.value = false
  selectedAnnouncement.value = null
  nextTick(() => bellRef.value?.focus())
}

function handleClose() {
  if (selectedAnnouncement.value) closeDetail()
  else closeModal()
}

function refreshAnnouncements() {
  if (loading.value || markingAll.value || readPending.value) return
  batchError.value = false
  announcementStore.fetchAnnouncements(true)
}

function openDetail(announcement: UserAnnouncement) {
  listScrollTop = listRef.value?.closest('.modal-body')?.scrollTop ?? 0
  selectedAnnouncement.value = announcement
  readError.value = false
  nextTick(() => {
    const body = detailRef.value?.closest('.modal-body')
    if (body) body.scrollTop = 0
    detailRef.value?.focus({ preventScroll: true })
  })
  if (!announcement.read_at) markAsRead(announcement.id)
}

function closeDetail() {
  const id = selectedAnnouncement.value?.id
  selectedAnnouncement.value = null
  readError.value = false
  nextTick(() => {
    const row = id ? rowRefs.get(id) : null
    const body = listRef.value?.closest('.modal-body')
    if (body) body.scrollTop = listScrollTop
    ;(row && !row.disabled ? row : listCloseRef.value)?.focus({ preventScroll: true })
  })
}

async function markAsRead(id: number) {
  if (readPending.value) return false
  readPending.value = id
  readError.value = false
  try {
    const success = await announcementStore.markAsRead(id)
    if (selectedAnnouncement.value?.id === id) readError.value = !success
    return success
  } finally {
    readPending.value = null
  }
}

async function markAsReadAndClose(id: number) {
  if (!await markAsRead(id)) return
  appStore.showSuccess(t('announcements.markedAsRead'))
  if (selectedAnnouncement.value?.id === id) closeDetail()
}

async function markAllAsRead() {
  if (markingAll.value || loading.value || readPending.value) return
  markingAll.value = true
  batchError.value = false
  try {
    await announcementStore.markAllAsRead()
    appStore.showSuccess(t('announcements.allMarkedAsRead'))
  } catch {
    batchError.value = true
  } finally {
    markingAll.value = false
  }
  if (!batchError.value) {
    await nextTick()
    refreshRef.value?.focus()
  }
}
</script>

<style scoped>
.announcement-bell { position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 6px; color: var(--ws-muted); }
.announcement-bell:hover { background: var(--ws-inset); color: var(--ws-text); }
.announcement-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; background: #dc2626; border-radius: 50%; }
.announcement-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 16px; color: var(--ws-muted); font-size: 13px; }
.announcement-toolbar-actions, .announcement-footer { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.announcement-rows { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--ws-border); }
.announcement-row { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 12px; border-bottom: 1px solid var(--ws-border); text-align: left; border-radius: 4px; }
.announcement-row:hover { background: var(--ws-inset); }
.announcement-row:disabled { cursor: wait; }
.announcement-row.is-unread { background: var(--ws-selected); }
.announcement-row-content { min-width: 0; }
.announcement-row-title { display: block; font-size: 14px; line-height: 1.6; color: var(--ws-text); overflow-wrap: anywhere; }
.is-unread .announcement-row-title { font-weight: 600; }
.announcement-row > svg { flex-shrink: 0; color: var(--ws-muted); }
.announcement-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; font-size: 12px; color: var(--ws-muted); }
.announcement-row .announcement-meta { margin-top: 6px; }
.announcement-detail { outline: none; min-width: 0; }
.announcement-content { margin-top: 24px; overflow-wrap: anywhere; }
.announcement-content :deep(img) { max-width: 100%; height: auto; }
.announcement-content :deep(.announcement-table-scroll) { width: 100%; max-width: 100%; overflow-x: auto; margin-bottom: 20px; }
.announcement-content :deep(table) { display: table; width: 100%; margin-bottom: 0; overflow-wrap: normal; }
.announcement-content :deep(blockquote) { border-left-width: 1px; background: var(--ws-inset); }
.announcement-content :deep(blockquote::before) { content: none; }
.announcement-content :deep(h1) { font-size: 24px; }
.announcement-content :deep(h2) { font-size: 20px; }
.announcement-content :deep(h3) { font-size: 17px; }
.announcement-content :deep(pre) { max-width: 100%; }
.announcement-read-status { margin-top: 20px; font-size: 12px; color: var(--ws-muted); }
.announcement-footer { justify-content: flex-end; width: 100%; }
.announcement-footer .btn { gap: 6px; }
.announcement-error { padding: 16px; margin-bottom: 12px; border: 1px solid var(--ws-border); border-radius: 6px; font-size: 13px; color: var(--ws-text); }
.announcement-error .btn { margin-top: 12px; }
.announcement-error-text { margin: 12px 0; color: #b91c1c; font-size: 13px; }
:global(.dark) .announcement-error-text { color: #fca5a5; }
.announcement-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 16px; color: var(--ws-muted); text-align: center; }
.announcement-empty h4 { color: var(--ws-text); font-size: 15px; font-weight: 600; }
.announcement-empty p { font-size: 13px; }
@media (max-width: 479px) {
  .announcement-row { padding: 16px 8px; gap: 8px; }
}
</style>
