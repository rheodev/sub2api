import { inject, type InjectionKey } from 'vue'
import type { SystemSettingsState } from '../useSystemSettings'

export const systemSettingsKey: InjectionKey<SystemSettingsState> = Symbol('system-settings')
export function useSystemSettingsContext(): SystemSettingsState {
  const state = inject(systemSettingsKey)
  if (!state) throw new Error('Settings panels require a settings workspace')
  return state
}
