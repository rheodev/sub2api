import { ref } from 'vue'

type TableDensity = 'standard' | 'compact'
const storageKey = 'frontend2:table-density'
const density = ref<TableDensity>('standard')

export function initTableDensity() {
  try {
    density.value = localStorage.getItem(storageKey) === 'compact' ? 'compact' : 'standard'
  } catch {
    density.value = 'standard'
  }
  document.documentElement.dataset.tableDensity = density.value
}

export function useTableDensity() {
  function toggleDensity() {
    density.value = density.value === 'standard' ? 'compact' : 'standard'
    document.documentElement.dataset.tableDensity = density.value
    try { localStorage.setItem(storageKey, density.value) } catch { /* Session-only preference. */ }
  }
  return { density, toggleDensity }
}
