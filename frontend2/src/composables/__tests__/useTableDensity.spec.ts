import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initTableDensity, useTableDensity } from '../useTableDensity'

describe('table density preference isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    initTableDensity()
  })

  it('restores the new preference and leaves legacy preferences unchanged', () => {
    localStorage.setItem('table-page-size', '50')
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('frontend2:table-density', 'compact')
    initTableDensity()
    const { density, toggleDensity } = useTableDensity()
    expect(density.value).toBe('compact')
    expect(document.documentElement.dataset.tableDensity).toBe('compact')
    toggleDensity()
    expect(localStorage.getItem('frontend2:table-density')).toBe('standard')
    expect(document.documentElement.dataset.tableDensity).toBe('standard')
    expect(localStorage.getItem('table-page-size')).toBe('50')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('remains usable when browser storage is unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => initTableDensity()).not.toThrow()
    const { density, toggleDensity } = useTableDensity()
    expect(density.value).toBe('standard')
    expect(() => toggleDensity()).not.toThrow()
    expect(document.documentElement.dataset.tableDensity).toBe('compact')
  })
})
