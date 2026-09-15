import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { AdminTabs } from './AdminTabs'
import { recomputeTracksForAdmin, type RecomputeTracksReport } from '../../services/admin'

type Progress = {
  examined: number
  recomputed: number
  withoutTrack: number
  failed: RecomputeTracksReport['failed']
}

const EMPTY: Progress = { examined: 0, recomputed: 0, withoutTrack: 0, failed: [] }

export function AdminMaintenance() {
  const { t } = useTranslation()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function recompute() {
    setRunning(true)
    setDone(false)
    setError(null)
    setProgress(EMPTY)

    const total: Progress = { ...EMPTY, failed: [] }
    let cursor: string | undefined

    try {
      // One batch at a time until the function stops handing back a cursor. The
      // running totals are shown as they arrive, because this takes minutes on an
      // instance with any history.
      do {
        const report = await recomputeTracksForAdmin(cursor)
        total.examined += report.examined
        total.recomputed += report.recomputed
        total.withoutTrack += report.withoutTrack
        total.failed = [...total.failed, ...report.failed]
        setProgress({ ...total })
        cursor = report.cursor
      } while (cursor)
      setDone(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('errors.unknown'))
    } finally {
      setRunning(false)
    }
  }

  return (
    <PageShell title={t('admin.maintenanceTitle')}>
      <AdminTabs />

      <section className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.recomputeTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{t('admin.recomputeHint')}</p>

        <button
          type="button"
          onClick={() => void recompute()}
          disabled={running}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {running ? t('admin.recomputeRunning') : t('admin.recomputeStart')}
        </button>

        {progress ? (
          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                {t('admin.recomputeExamined')}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{progress.examined}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                {t('admin.recomputeUpdated')}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{progress.recomputed}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">
                {t('admin.recomputeFailed')}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{progress.failed.length}</dd>
            </div>
          </dl>
        ) : null}

        {done ? <p className="mt-3 text-sm text-success">{t('admin.recomputeDone')}</p> : null}
        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {/* Named, so an operator can go and look at the ones that did not work. */}
        {progress && progress.failed.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {progress.failed.slice(0, 10).map((failure) => (
              <li key={failure.eventId}>
                {failure.eventId}: {failure.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </PageShell>
  )
}
