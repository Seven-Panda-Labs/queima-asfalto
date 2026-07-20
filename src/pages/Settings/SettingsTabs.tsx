import { useTranslation } from 'react-i18next'
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
    <div
      className="inline-flex w-full flex-wrap gap-1 rounded-lg border border-border bg-background p-1"
      role="tablist"
      aria-label={t('settings.tabsLabel')}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={[
              'relative rounded-md px-3 py-2 text-sm font-semibold transition-colors',
              active ? 'bg-primary text-white' : 'text-muted hover:text-foreground',
            ].join(' ')}
          >
            <span className="inline-flex items-center gap-1.5">
              {t(tab.labelKey)}
              {tab.badge && tab.badge > 0 ? (
                <span
                  className={[
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
                    active ? 'bg-white text-primary' : 'bg-accent text-white',
                  ].join(' ')}
                  aria-label={t('nav.pendingInvites', { count: tab.badge })}
                >
                  {tab.badge}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
