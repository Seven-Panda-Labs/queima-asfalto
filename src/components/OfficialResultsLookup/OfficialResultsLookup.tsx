import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { timingDisclaimerPath } from '../../config/timingDisclaimer'
import type { Event } from '../../types/Event'
import type { OfficialResultCandidate } from '../../../shared/officialResults'
import { detectPlatform, resultsPlatformLabel } from '../../../shared/officialResults'
import { canLookupPlatform } from '../../types/UserResultsProfile'
import { useUserResultsProfile } from '../../hooks/useUserResultsProfile'
import { startLookupCooldownFromError, useLookupCooldown } from '../../hooks/useLookupCooldown'
import { lookupOfficialResults } from '../../services/officialResultsLookup'
import { saveResults } from '../../services/events'
import { formatClassification } from '../../utils/classification'
import { isFutureDate } from '../../utils/date'
import { splitTime } from '../../utils/time'

type OfficialResultsLookupProps = {
  event: Event
  onApplied?: () => void
}

export function OfficialResultsLookup({ event, onApplied }: OfficialResultsLookupProps) {
  const { t } = useTranslation()
  const { profile } = useUserResultsProfile()
  const { remainingSeconds, isCoolingDown, startCooldown } = useLookupCooldown()
  const [searching, setSearching] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<OfficialResultCandidate[] | null>(null)

  const platform = event.resultsPlatform ?? detectPlatform(event.resultsUrl, event.name)
  const isPastOrToday = !isFutureDate(event.date)
  const canLookup =
    platform &&
    isPastOrToday &&
    (event.status === 'confirmed' || event.status === 'completed') &&
    canLookupPlatform(platform, profile, event.resultsUrl)

  if (!platform || !isPastOrToday || (event.status !== 'confirmed' && event.status !== 'completed')) {
    return null
  }

  async function handleSearch() {
    setSearching(true)
    setError(null)
    setCandidates(null)

    try {
      const results = await lookupOfficialResults(event.id)
      if (results.length === 0) {
        setError(t('officialResults.notFound'))
      } else {
        setCandidates(results)
      }
      startCooldown()
    } catch (lookupError) {
      const code =
        lookupError && typeof lookupError === 'object' && 'code' in lookupError
          ? String((lookupError as { code: string }).code)
          : ''
      if (code.includes('failed-precondition')) {
        setError(t('officialResults.preconditionFailed'))
        startCooldown()
      } else if (code.includes('resource-exhausted')) {
        setError(t('officialResults.rateLimited'))
        startLookupCooldownFromError(lookupError, startCooldown)
      } else {
        setError(t('officialResults.lookupError'))
        startCooldown()
      }
    } finally {
      setSearching(false)
    }
  }

  const searchButtonLabel = searching
    ? t('officialResults.searching')
    : isCoolingDown
      ? t('officialResults.searchCooldown', { seconds: remainingSeconds })
      : t('officialResults.search')

  async function handleApply(candidate: OfficialResultCandidate) {
    setApplying(true)
    setError(null)

    try {
      const classification =
        candidate.position && candidate.totalParticipants
          ? formatClassification(candidate.position, candidate.totalParticipants)
          : candidate.position
            ? String(candidate.position)
            : undefined

      await saveResults(event.id, {
        time: candidate.time,
        classification,
        verified: true,
      })
      setCandidates(null)
      onApplied?.()
    } catch {
      setError(t('officialResults.applyError'))
    } finally {
      setApplying(false)
    }
  }

  const timeParts = candidates?.[0] ? splitTime(candidates[0].time) : null

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">{t('officialResults.lookupTitle')}</h3>
      <p className="mt-1 text-xs text-muted">{t('officialResults.lookupHint')}</p>
      <p className="mt-1 text-xs text-muted">
        {t('officialResults.disclaimer')}{' '}
        <Link
          to={timingDisclaimerPath()}
          className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('officialResults.disclaimerLink')}
        </Link>
      </p>

      {!canLookup ? (
        <p className="mt-3 text-sm text-muted">
          {platform === 'parkrun'
            ? t('officialResults.configureParkrun')
            : t('officialResults.configurePlatform')}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void handleSearch()}
          disabled={searching || applying || isCoolingDown}
          className="mt-3 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
        >
          {searchButtonLabel}
        </button>
      )}

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {candidates && candidates.length > 0 ? (
        <div className="mt-4 space-y-3 rounded-md border border-border bg-background p-4">
          {candidates.map((candidate, index) => (
            <div key={`${candidate.platform}-${index}`} className="space-y-2">
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
                onClick={() => void handleApply(candidate)}
                disabled={applying}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {applying ? t('common.saving') : t('officialResults.apply')}
              </button>
            </div>
          ))}
          {timeParts ? (
            <p className="text-xs text-muted">
              {t('officialResults.previewTime', {
                time: `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
