import { useTranslation } from 'react-i18next'
import { ViewSwitcher } from '../../components/ViewSwitcher'
import type { SettingsTab } from './settingsTab'

type SettingsTabConfig = {
  id: SettingsTab
  labelKey: string
  badge?: number
}

type SettingsTabsProps = {
  tabs: SettingsTabConfig[]
  activeTab: SettingsTab
  onChange: (tab: SettingsTab) => void
}

export function SettingsTabs({ tabs, activeTab, onChange }: SettingsTabsProps) {
  const { t } = useTranslation()

  return (
    <ViewSwitcher
      as="tablist"
      label={t('settings.tabsLabel')}
      value={activeTab}
      onChange={onChange}
      options={tabs.map((tab) => ({
        value: tab.id,
        label: t(tab.labelKey),
        badge: tab.badge,
        badgeLabel: tab.badge ? t('nav.pendingInvites', { count: tab.badge }) : undefined,
      }))}
    />
  )
}
