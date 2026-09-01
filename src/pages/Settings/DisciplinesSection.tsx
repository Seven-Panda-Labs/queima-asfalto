import { useTranslation } from 'react-i18next'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { useToast } from '../../contexts/ToastContext'
import { EVENT_TYPES, type EventType } from '../../domain/eventCodes'
import { groupedDisciplines, type DisciplineGroupId } from '../../domain/disciplineGroups'
import { formatEventTypeLabel } from '../../i18n/formatters'

const GROUP_LABEL_KEYS: Record<DisciplineGroupId, string> = {
  short: 'settings.disciplineGroupShort',
  road: 'settings.disciplineGroupRoad',
  ultra: 'settings.disciplineGroupUltra',
}

/**
 * Mirrors `FilterPill`, which cannot be reused directly: this is a checkbox
 * group, so the state comes from the input rather than from a prop. The input
 * stays a real checkbox and only the paint is borrowed.
 */
const PILL_CLASSES = [
  'inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
  'text-muted ring-1 ring-border hover:text-foreground',
  'peer-checked:bg-primary peer-checked:text-white peer-checked:ring-0',
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
].join(' ')

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

      <fieldset disabled={saving} className="mt-4 space-y-4">
        <legend className="sr-only">{t('settings.disciplinesSection')}</legend>
        {groupedDisciplines().map((group) => (
          <div key={group.id}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t(GROUP_LABEL_KEYS[group.id])}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.disciplines.map((discipline) => {
                const checked = enabledDisciplines.includes(discipline)
                // The last one standing cannot be turned off: a UI with no
                // disciplines cannot create a race, a goal or a bucket list item.
                const lastOne = checked && enabledDisciplines.length === 1

                return (
                  <label key={discipline}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={lastOne}
                      onChange={(event) => void handleToggle(discipline, event.target.checked)}
                      className="peer sr-only"
                    />
                    <span className={PILL_CLASSES}>{formatEventTypeLabel(discipline)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <p className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted">
        {t('settings.disciplinesKeepsData')}
      </p>

      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </section>
  )
}
