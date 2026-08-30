import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PersonalRecordIndicator } from '../PersonalRecordIndicator/PersonalRecordIndicator'
import type { BestPerformance } from '../../utils/bestPerformances'
import { formatDatePt } from '../../utils/date'

/**
 * Recordes pessoais. Usa a mesma gramática da faixa do ano: número grande,
 * rótulo pequeno. Fecha a página, longe dos números de 2026, para que as
 * marcas de sempre não se confundam com o que se fez este ano.
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
        <Link to="/analise" className="text-sm font-semibold text-primary hover:underline">
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

            {/* Tempo e ritmo valem o mesmo: mesmo tamanho, lado a lado. */}
            <div className="mt-2 flex gap-5">
              <div>
                <p className="font-display text-2xl leading-none tracking-wide text-foreground">
                  {record.time}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('common.time')}
                </p>
              </div>
              <div>
                <p className="font-display text-2xl leading-none tracking-wide text-foreground">
                  {record.pace}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {t('common.paceUnit')}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="truncate text-xs text-muted">
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
          </div>
        ))}
      </div>
    </section>
  )
}
