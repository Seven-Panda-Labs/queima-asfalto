import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { TrackProfileChart } from './TrackProfileChart'
import { TrackSplitsTable } from './TrackSplitsTable'
import { useToast } from '../../contexts/ToastContext'
import { TRACK_FILE_ACCEPT } from '../../constants/activityTrack'
import { deleteEventTrack, uploadEventTrack } from '../../services/eventTrack'
import type { UploadTrackErrorCode } from '../../services/eventTrack'
import type { Event } from '../../types/Event'
import type { EventTrack } from '../../types/EventTrack'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'

type EventTrackSectionProps = {
  event: Event
  track: EventTrack | null
  loading: boolean
  userId: string
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
    </div>
  )
}

export function EventTrackSection({ event, track, loading, userId }: EventTrackSectionProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [errorCode, setErrorCode] = useState<UploadTrackErrorCode | null>(null)
  const [pendingReplacement, setPendingReplacement] = useState<File | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function upload(file: File) {
    if (!navigator.onLine) {
      toast.error(t('eventTrack.offline'))
      return
    }

    setUploading(true)
    setErrorCode(null)
    try {
      const result = await uploadEventTrack(event.id, userId, file)
      if (result.ok) {
        toast.success(t(result.replaced ? 'eventTrack.replaced' : 'eventTrack.uploaded'))
      } else {
        setErrorCode(result.code)
      }
    } catch {
      toast.error(t('errors.unknown'))
    } finally {
      setUploading(false)
      setPendingReplacement(null)
    }
  }

  /** Picking a file is the intent when there is nothing to lose. Replacing is not. */
  function handleFilePicked(changeEvent: React.ChangeEvent<HTMLInputElement>) {
    const file = changeEvent.target.files?.[0]
    changeEvent.target.value = ''
    if (!file) return

    if (track) {
      setPendingReplacement(file)
      return
    }
    void upload(file)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteEventTrack(event.id)
      toast.success(t('eventTrack.removed'))
    } catch {
      toast.error(t('errors.unknown'))
    } finally {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">{t('eventTrack.title')}</h2>

      {loading ? <p className="mt-2 text-sm text-muted">{t('common.loading')}</p> : null}

      {!loading && !track ? (
        <p className="mt-2 text-sm text-muted">{t('eventTrack.empty')}</p>
      ) : null}

      {track ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={t('common.time')} value={formatDurationSeconds(track.elapsedSeconds)} />
            <Stat
              label={t('eventTrack.measuredDistance')}
              value={`${(track.distanceMeters / 1000).toFixed(2)} km`}
            />
            <Stat
              label={t('common.paceUnit')}
              value={formatPaceSeconds(track.averagePaceSecondsPerKm)}
            />
            <Stat
              label={t('eventTrack.elevationGain')}
              value={`${track.elevationGainMeters} m`}
            />
          </dl>

          <p className="mt-2 text-xs text-muted">{t('eventTrack.elevationApproximate')}</p>

          <div className="mt-5">
            <TrackProfileChart profile={track.profile} />
          </div>

          <div className="mt-5">
            <TrackSplitsTable splits={track.splits} showHeartRate={Boolean(track.heartRate)} />
          </div>

          <p className="mt-4 text-xs text-muted">
            {t('eventTrack.fileMeta', {
              fileName: track.fileName,
              format: track.format.toUpperCase(),
            })}
          </p>
        </>
      ) : null}

      {errorCode ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {t(`eventTrack.errors.${errorCode}`)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
        <input
          ref={inputRef}
          type="file"
          accept={TRACK_FILE_ACCEPT}
          onChange={handleFilePicked}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background disabled:opacity-60"
        >
          {uploading
            ? t('eventTrack.uploading')
            : track
              ? t('eventTrack.replace')
              : t('eventTrack.upload')}
        </button>
        {track ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={uploading}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-background disabled:opacity-60"
          >
            {t('common.delete')}
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-muted">{t('eventTrack.formatsHint')}</p>

      <ConfirmDialog
        open={pendingReplacement !== null}
        title={t('eventTrack.confirmReplaceTitle')}
        message={t('eventTrack.confirmReplaceMessage', {
          fileName: pendingReplacement?.name ?? '',
        })}
        confirmLabel={t('eventTrack.replace')}
        loading={uploading}
        onConfirm={() => {
          if (pendingReplacement) void upload(pendingReplacement)
        }}
        onCancel={() => setPendingReplacement(null)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title={t('eventTrack.confirmDeleteTitle')}
        message={t('eventTrack.confirmDeleteMessage')}
        confirmLabel={t('common.delete')}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </section>
  )
}
