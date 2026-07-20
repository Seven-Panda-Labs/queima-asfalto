import { describe, expect, it } from 'vitest'
import { parseSettingsTab } from './settingsTab'

describe('parseSettingsTab', () => {
  it('defaults to app', () => {
    expect(parseSettingsTab(null)).toBe('app')
    expect(parseSettingsTab('invalid')).toBe('app')
  })

  it('parses valid tabs', () => {
    expect(parseSettingsTab('partilhas')).toBe('partilhas')
    expect(parseSettingsTab('dados')).toBe('dados')
    expect(parseSettingsTab('app')).toBe('app')
  })
})
