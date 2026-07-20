import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell/PageShell'
import { useShares } from '../../hooks/useShares'
import { SettingsAccountSection } from './SettingsAccountSection'
import { SettingsAppSection } from './SettingsAppSection'
import { SettingsDataSection } from './SettingsDataSection'
import { SettingsTabs } from './SettingsTabs'
import { SharesSection } from './SharesSection'
import { parseSettingsTab, type SettingsTab } from './settingsTab'

export function Settings() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { pendingReceivedCount } = useShares()
  const activeTab = parseSettingsTab(searchParams.get('tab'))

  const tabs = useMemo(
    () => [
      { id: 'app' as const, labelKey: 'settings.tabs.app' },
      {
        id: 'partilhas' as const,
        labelKey: 'settings.tabs.shares',
        badge: pendingReceivedCount,
      },
      { id: 'dados' as const, labelKey: 'settings.tabs.data' },
      { id: 'conta' as const, labelKey: 'settings.tabs.account' },
    ],
    [pendingReceivedCount],
  )

  function setActiveTab(tab: SettingsTab) {
    const next = new URLSearchParams(searchParams)
    if (tab === 'app') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <PageShell title={t('settings.title')}>
      <div className="mt-6 flex flex-col gap-6">
        <SettingsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className={activeTab === 'dados' ? 'max-w-4xl' : 'max-w-3xl'}>
          {activeTab === 'conta' ? <SettingsAccountSection /> : null}
          {activeTab === 'app' ? <SettingsAppSection /> : null}
          {activeTab === 'partilhas' ? <SharesSection /> : null}
          {activeTab === 'dados' ? <SettingsDataSection /> : null}
        </div>
      </div>
    </PageShell>
  )
}
