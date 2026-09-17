import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { timingDisclaimerPath } from '../../config/timingDisclaimer'
import type { OfficialResultCandidate } from '../../../shared/officialResults'
import { resultsPlatformLabel } from '../../../shared/officialResults'
import { splitTime } from '../../utils/time'

type OfficialResultCandidatesProps = {
  candidates: OfficialResultCandidate[]
  applying: boolean
  onApply: (candidate: OfficialResultCandidate) => void
  onCancel: () => void
  /** Anything the source wants said about this batch, above the disclaimer. */
  note?: ReactNode
}

/**
 * What the app found, for the runner to confirm before it becomes their time.
 *
 * Shared because a result can arrive two ways, read off the operator's page or
 * read out of the PDF they saved, and the reader should not have to tell which
 * by how the answer looks.
 */
export function OfficialResultCandidates({
  candidates,
  applying,
  onApply,
  onCancel,
  note,
}: OfficialResultCandidatesProps) {
  const { t } = useTranslation()
  if (candidates.length === 0) return null

  const timeParts = candidates[0] ? splitTime(candidates[0].time) : null

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-4">
      {candidates.map((candidate, index) => (
        <div key={`${candidate.platform}-${candidate.position ?? index}-${index}`} className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{candidate.matchedName}</p>
          <dl className="grid gap-1 text-sm text-muted sm:grid-cols-2">
            <div>
              <dt className="inline font-semibold">{t('common.time')}: </dt>
              <dd className="inline text-foreground">{candidate.time}</dd>
            </div>
            {candidate.position ? (
              <div>
                <dt className="inline font-semibold">{t('resultsForm.position')}: </dt>
                <dd className="inline text-foreground">
                  {candidate.totalParticipants
                    ? `${candidate.position} / ${candidate.totalParticipants}`
                    : candidate.position}
                </dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="inline font-semibold">{t('officialResults.platform')}: </dt>
              <dd className="inline text-foreground">{resultsPlatformLabel(candidate.platform)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => onApply(candidate)}
            disabled={applying}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {applying ? t('common.saving') : t('officialResults.apply')}
          </button>
        </div>
      ))}

      {candidates.length === 1 && timeParts ? (
        <p className="text-xs text-muted">
          {t('officialResults.previewTime', {
            time: `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`,
          })}
        </p>
      ) : null}

      {note}

      <p className="text-xs text-muted">
        {t('officialResults.disclaimer')}{' '}
        <Link
          to={timingDisclaimerPath()}
          className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('officialResults.disclaimerLink')}
        </Link>
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}
