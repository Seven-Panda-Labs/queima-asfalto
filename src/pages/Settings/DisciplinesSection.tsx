import { useTranslation } from 'react-i18next'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { useToast } from '../../contexts/ToastContext'
import { EVENT_TYPES, type EventType } from '../../domain/eventCodes'
import { formatEventTypeLabel } from '../../i18n/formatters'

export function DisciplinesSection() {
  const { t } = useTranslation()
  const toast = useToast()
  const { enabledDisciplines, loading, saving, error, saveEnabledDisciplines } = useDisciplines()

  async function handleToggle(discipline: EventType, checked: boolean) {
    const next = checked
      ? EVENT_TYPES.filter(
          (type) => type === discipline || enabledDisciplines.includes(type),
        )
      : enabledDisciplines.filter((type) => type !== discipline)

    if (next.length === 0) {
      toast.error(t('settings.disciplinesMinimum'))
      return
    }

    try {
      await saveEnabledDisciplines(next)
    } catch {
      toast.error(t('notifications.savePrefsError'))
    }
  }

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.disciplinesSection')}</h2>
        <p className="mt-2 text-sm text-muted">{t('common.loading')}</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-foreground">{t('settings.disciplinesSection')}</h2>
      <p className="mt-2 text-sm text-muted">{t('settings.disciplinesSubtitle')}</p>

      <fieldset disabled={saving} className="mt-4 space-y-3">
        <legend className="sr-only">{t('settings.disciplinesSection')}</legend>
        {EVENT_TYPES.map((discipline) => {
          const checked = enabledDisciplines.includes(discipline)
          const lastOne = checked && enabledDisciplines.length === 1

          return (
            <label key={discipline} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checked}
                disabled={lastOne}
                onChange={(event) => void handleToggle(discipline, event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-medium text-foreground">
                {formatEventTypeLabel(discipline)}
              </span>
            </label>
          )
        })}
      </fieldset>

      <p className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted">
        {t('settings.disciplinesKeepsData')}
      </p>

      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </section>
  )
}
