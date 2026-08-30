import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { DataQuality } from '../../utils/analytics/dataQuality'
import { buildEventDetailPath, eventLinkState } from '../../utils/eventNavigation'
import { formatDatePt } from '../../utils/date'

type DataQualityPanelProps = {
  quality: DataQuality
  returnTo: string
  ownerId: string | null
  /** Numa vista partilhada não se pede a ninguém que corrija dados alheios. */
  readOnly: boolean
}

/** Quantas provas por preencher chegam a merecer uma lista em vez de um número. */
const LISTED_EXCLUSIONS = 5

/**
 * A análise vale o que valem os dados. Este painel existe para a página não
 * fingir que doze provas contam quando só oito têm tempo — e para dizer quais
 * faltam preencher.
 */
export function DataQualityPanel({
  quality,
  returnTo,
  ownerId,
  readOnly,
}: DataQualityPanelProps) {
  const { t } = useTranslation()

  const listed = quality.excluded.slice(0, LISTED_EXCLUSIONS)
  const hidden = quality.excluded.length - listed.length

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm">
      <p className="text-muted">
        {t('analysis.qualityCounts', {
          analysable: quality.analysable,
          completed: quality.completed,
        })}{' '}
        {t('analysis.qualityVerified', { percent: quality.verifiedPercent })}
      </p>

      {quality.missingClassification > 0 ? (
        <p className="mt-2 text-muted">
          {t('analysis.qualityMissingClassification', { count: quality.missingClassification })}
        </p>
      ) : null}

      {quality.excluded.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="font-semibold text-foreground">
            {t('analysis.qualityExcluded', { count: quality.excluded.length })}
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            {listed.map((event) => (
              <li key={event.id}>
                {readOnly ? (
                  <span>
                    {formatDatePt(event.date)} · {event.name}
                  </span>
                ) : (
                  <Link
                    to={buildEventDetailPath(event.id, { ownerId, returnTo })}
                    state={eventLinkState(returnTo).state}
                    className="underline-offset-2 hover:text-primary hover:underline"
                  >
                    {formatDatePt(event.date)} · {event.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {hidden > 0 ? (
            <p className="mt-1 text-xs text-muted">{t('analysis.qualityMore', { count: hidden })}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
