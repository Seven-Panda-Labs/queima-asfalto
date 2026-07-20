export const SETTINGS_TABS = ['app', 'partilhas', 'dados', 'conta'] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]

export function parseSettingsTab(value: string | null): SettingsTab {
  if (value && SETTINGS_TABS.includes(value as SettingsTab)) {
    return value as SettingsTab
  }
  return 'app'
}
