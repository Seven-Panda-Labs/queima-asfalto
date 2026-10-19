import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { WeightChart } from '../../components/Charts/WeightChart'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { TrashIcon } from '../../components/icons/actionIcons'
import { PageShell } from '../../components/PageShell/PageShell'
import { useToast } from '../../contexts/ToastContext'
import { useWeightEntries } from '../../hooks/useWeightEntries'
import { formatDatePt, parseDateInput, toDateInputValue } from '../../utils/date'
import { MAX_NOTE_LENGTH, parseNote, parseWeightKg, summarizeWeights } from '../../utils/weightLog'
import { TOOLS_PATH } from './Tools'

const RECENT_ENTRIES = 10

function Change({ value, formatKg }: { value: number | null; formatKg: (value: number) => string }) {
  const { t } = useTranslation()
  if (value === null) return <>{t('common.dash')}</>
  if (value === 0) return <>{formatKg(0)}</>
  return (
    <>
      <span aria-hidden>{value < 0 ? '▼' : '▲'}</span>
      <span className="sr-only">{t(value < 0 ? 'tools.weightLog.down' : 'tools.weightLog.up')} </span>
      {formatKg(Math.abs(value))}
    </>
  )
}

export function WeightLog() {
  const { t, i18n } = useTranslation()
  const toast = useToast()
  const { entries, loading, error, saveDay, removeDay } = useWeightEntries()
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [day, setDay] = useState(() => toDateInputValue(new Date()))
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const kg = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const formatKg = (value: number) => t('tools.weightLog.kg', { weight: kg.format(value) })
  const summary = summarizeWeights(entries)
  const newestFirst = [...entries].reverse()
  const visibleEntries = showAll ? newestFirst : newestFirst.slice(0, RECENT_ENTRIES)

  const existing = entries.find((entry) => entry.date === day)
  const existingWeight = existing?.weightKg
  const existingNote = existing?.note
  const loaded = useRef({ weight: '', note: '' })

  // Picking a day with an entry loads it. An empty day keeps what was typed,
  // unless that was only loaded from the day picked before.
  useEffect(() => {
    const format = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    const next = { weight: existingWeight === undefined ? '' : format.format(existingWeight), note: existingNote ?? '' }
    const hasEntry = existingWeight !== undefined || existingNote !== undefined
    const previous = loaded.current
    setWeight((current) => (hasEntry || current === previous.weight ? next.weight : current))
    setNote((current) => (hasEntry || current === previous.note ? next.note : current))
    loaded.current = next
  }, [day, existingWeight, existingNote, i18n.language])

  const parsedWeight = weight.trim() === '' ? undefined : parseWeightKg(weight)
  const parsedNote = parseNote(note) ?? undefined
  const weightInvalid = parsedWeight === null
  // Saving a day emptied of both removes it, so an entry makes an empty form savable.
  const canSave = !saving && !weightInvalid && (parsedWeight !== undefined || parsedNote !== undefined || !!existing)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      const outcome = await saveDay(day, { weightKg: parsedWeight ?? undefined, note: parsedNote })
      if (outcome !== 'unchanged') toast.success(t(`tools.weightLog.${outcome}`))
    } catch {
      toast.error(t('tools.weightLog.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await removeDay(entryId)
    } catch {
      toast.error(t('tools.weightLog.deleteError'))
    }
  }

  const stats = summary
    ? [
        { label: t('tools.weightLog.current'), value: formatKg(summary.latestKg) },
        { label: t('tools.weightLog.last7Days'), value: <Change value={summary.last7DaysKg} formatKg={formatKg} /> },
        { label: t('tools.weightLog.last30Days'), value: <Change value={summary.last30DaysKg} formatKg={formatKg} /> },
        { label: t('tools.weightLog.total'), value: <Change value={summary.totalKg} formatKg={formatKg} /> },
      ]
    : []

  return (
    <PageShell title={t('tools.weightLog.title')}>
      <Link to={TOOLS_PATH} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
        {t('tools.back')}
      </Link>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="weight" className="block text-sm font-semibold text-foreground">
            {t('tools.weightLog.weightKg')}
          </label>
          <input
            id="weight"
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="75"
            className="mt-1 w-32 rounded-md border border-border bg-surface px-3 py-2"
          />
        </div>
        <div className="w-48">
          <label htmlFor="weightDay" className="block text-sm font-semibold text-foreground">
            {t('tools.weightLog.day')}
          </label>
          <DatePicker id="weightDay" value={parseDateInput(day)} onChange={(date) => setDay(toDateInputValue(date))} />
        </div>
        <div className="min-w-48 flex-1">
          <label htmlFor="weightNote" className="block text-sm font-semibold text-foreground">
            {t('tools.weightLog.noteOptional')}
          </label>
          <input
            id="weightNote"
            type="text"
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('tools.weightLog.notePlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {t('common.save')}
        </button>
      </form>
      {weightInvalid ? (
        <p className="mt-2 text-sm text-danger">{t('tools.weightLog.invalidWeight')}</p>
      ) : null}

      {error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-sm text-muted">{t('common.loading')}</p>
      ) : entries.length > 0 ? (
        <div className="mt-8 space-y-6">
          {summary ? (
            <>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
                {stats.map(({ label, value }) => (
                  <div key={label} className="bg-surface px-4 py-4 text-center">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <WeightChart entries={entries} />
            </>
          ) : null}

          {/* Closed by default: it grows every day, and the chart already tells the story. */}
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              {t('tools.weightLog.entries', { count: entries.length })}
            </summary>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
              {visibleEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <span className="shrink-0 text-muted">{formatDatePt(parseDateInput(entry.date))}</span>
                  <span className="min-w-0 flex-1 truncate text-muted" title={entry.note}>
                    {entry.note}
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {entry.weightKg === undefined ? t('common.dash') : formatKg(entry.weightKg)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry.id)}
                    aria-label={t('common.delete')}
                    title={t('common.delete')}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-danger"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
            {!showAll && newestFirst.length > RECENT_ENTRIES ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-2 text-sm font-semibold text-primary hover:underline"
              >
                {t('tools.weightLog.showAll', { count: newestFirst.length })}
              </button>
            ) : null}
          </details>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">{t('tools.weightLog.empty')}</p>
      )}
    </PageShell>
  )
}
