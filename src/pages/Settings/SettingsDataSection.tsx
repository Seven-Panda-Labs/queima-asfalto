import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useEvents } from '../../hooks/useEvents'
import { exportEventsToExcel } from '../../services/export'
import { ImportSection } from './ImportSection'
import { ResultsProfileSection } from './ResultsProfileSection'

export function SettingsDataSection() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const { allEvents } = useEvents()
  const { items: bucketListItems } = useBucketList()
  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(() => searchParams.get('import') === '1')

  async function handleExport() {
    if (allEvents.length === 0 && bucketListItems.length === 0) return

    setExporting(true)
    try {
      await exportEventsToExcel(allEvents, undefined, bucketListItems)
      toast.success(t('settings.exportSuccess'))
    } catch {
      toast.error(t('settings.exportError'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <ResultsProfileSection />

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.data')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settings.dataSubtitle')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            {t('settings.importExcel')}
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || (allEvents.length === 0 && bucketListItems.length === 0)}
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? t('settings.exporting') : t('settings.exportExcel')}
          </button>
        </div>
        {allEvents.length === 0 && bucketListItems.length === 0 ? (
          <p className="mt-3 text-xs text-muted">{t('settings.exportUnavailable')}</p>
        ) : null}

        {importOpen ? (
          <div className="mt-6 border-t border-border pt-6">
            <ImportSection embedded />
          </div>
        ) : null}
      </section>
    </div>
  )
}
