import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PersonalRecordIndicator } from '../PersonalRecordIndicator/PersonalRecordIndicator'
import type { BestPerformance } from '../../utils/bestPerformances'
import { formatDatePt } from '../../utils/date'

/**
 * Recordes de sempre. Repete a gramática da faixa do ano de propósito — são
 * duas leituras dos mesmos treinos — mas leva título próprio, porque misturar
 * marcas absolutas com números do ano corrente confunde as duas escalas.
 */
export function RecordStrip({ records }: { records: BestPerformance[] }) {
  const { t } = useTranslation()

  if (records.length === 0) return null

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wide text-foreground">
          {t('dashboard.personalBests')}
        </h2>
        <Link to="/resultados" className="text-sm font-semibold text-primary hover:underline">
          {t('dashboard.viewResults')} <span className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px overflow-hidden rounded-xl border border-border bg-border">
        {records.map((record) => (
          <div key={record.eventType} className="bg-surface px-4 py-4">
            <div className="flex items-center gap-2">
              <PersonalRecordIndicator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                {record.label}
              </p>
            </div>
            <p className="mt-1 font-display text-3xl leading-none tracking-wide text-foreground">
              {record.time}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {record.pace} min/Km ·{' '}
              <Link
                to={`/eventos/${record.eventId}`}
                className="underline-offset-2 hover:text-primary hover:underline"
              >
                {record.eventName}
              </Link>
            </p>
            <p className="text-xs text-muted">
              {formatDatePt(record.date)} · {record.recordAge}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
