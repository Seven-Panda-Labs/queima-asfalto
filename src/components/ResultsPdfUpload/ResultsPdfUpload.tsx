import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OfficialResultCandidates } from '../OfficialResultCandidates'
import { useUserResultsProfile } from '../../hooks/useUserResultsProfile'
import { RESULTS_PDF_ACCEPT } from '../../constants/resultsPdf'
import { importResultsPdf, type ResultsPdfImport } from '../../services/resultsPdfImport'
import { saveResults } from '../../services/events'
import { formatClassification } from '../../utils/classification'
import type { Event } from '../../types/Event'
import type { OfficialResultCandidate, ResultsPlatform } from '../../../shared/officialResults'

type ResultsPdfUploadProps = {
  event: Event
  platform: ResultsPlatform
  onApplied: () => void
}

/**
 * The way in when the operator publishes results but refuses to be read.
 *
 * The file is opened here, in the browser, and never uploaded: a field's
 * ranking carries every finisher's name, and none of it needs to leave the
 * machine for this runner to find their own row.
 */
export function ResultsPdfUpload({ event, platform, onApplied }: ResultsPdfUploadProps) {
  const { t } = useTranslation()
  const { profile } = useUserResultsProfile()
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<ResultsPdfImport | null>(null)

  async function handleFilePicked(changeEvent: React.ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0]
    // Cleared straight away so picking the same file twice still fires.
    changeEvent.target.value = ''
    if (!file) return

    setReading(true)
    setError(null)
    setFound(null)

    try {
      const outcome = await importResultsPdf(
        file,
        { date: event.date, platform, resultsUrl: event.resultsUrl },
        profile,
      )
      if (outcome.ok) setFound(outcome.result)
      else setError(t(`resultsPdf.errors.${outcome.code}`))
    } catch {
      setError(t('resultsPdf.errors.unreadable'))
    } finally {
      setReading(false)
    }
  }

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
      setFound(null)
      onApplied()
    } catch {
      setError(t('officialResults.applyError'))
    } finally {
      setApplying(false)
    }
  }

  const note = found ? (
    <>
      {found.eventName ? (
        <p className="text-xs text-muted">
          {t('resultsPdf.readFrom', { event: found.eventName })}
        </p>
      ) : null}
      {found.preliminary ? (
        <p className="text-xs text-muted">{t('resultsPdf.preliminary')}</p>
      ) : null}
      {found.truncated ? <p className="text-xs text-muted">{t('resultsPdf.truncated')}</p> : null}
    </>
  ) : null

  return (
    <div className="mt-4">
      <p className="text-xs text-muted">
        {t(platform === 'parkrun' ? 'resultsPdf.hintPrint' : 'resultsPdf.hint')}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={RESULTS_PDF_ACCEPT}
        onChange={(changeEvent) => void handleFilePicked(changeEvent)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={reading || applying}
        className="mt-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
      >
        {reading ? t('resultsPdf.reading') : t('resultsPdf.choose')}
      </button>

      <div aria-live="polite">
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        {found ? (
          <OfficialResultCandidates
            candidates={found.candidates}
            applying={applying}
            onApply={(candidate) => void handleApply(candidate)}
            onCancel={() => setFound(null)}
            note={note}
          />
        ) : null}
      </div>
    </div>
  )
}
