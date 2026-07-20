import { useTranslation } from 'react-i18next'
import { ParkrunnerIdInput } from '../ParkrunnerIdInput/ParkrunnerIdInput'

type ParkrunProfilePromptDialogProps = {
  open: boolean
  parkrunnerId: string
  onParkrunnerIdChange: (value: string) => void
  onSaveAndContinue: () => void
  onContinueWithout: () => void
  onCancel: () => void
  saving?: boolean
  fieldError?: string | null
}

export function ParkrunProfilePromptDialog({
  open,
  parkrunnerId,
  onParkrunnerIdChange,
  onSaveAndContinue,
  onContinueWithout,
  onCancel,
  saving = false,
  fieldError = null,
}: ParkrunProfilePromptDialogProps) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-foreground/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parkrun-prompt-title"
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <h2 id="parkrun-prompt-title" className="text-lg font-semibold text-foreground">
          {t('eventForm.parkrunPromptTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted">{t('eventForm.parkrunPromptMessage')}</p>

        <div className="mt-4">
          <label htmlFor="parkrun-prompt-id" className="block text-sm font-semibold text-foreground">
            {t('officialResults.parkrunnerId')}
          </label>
          <div className="mt-1">
            <ParkrunnerIdInput
              id="parkrun-prompt-id"
              value={parkrunnerId}
              onChange={onParkrunnerIdChange}
              hasError={Boolean(fieldError)}
            />
          </div>
          {fieldError ? <p className="mt-2 text-sm text-danger">{fieldError}</p> : null}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onContinueWithout}
            disabled={saving}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60"
          >
            {t('eventForm.parkrunPromptSkip')}
          </button>
          <button
            type="button"
            onClick={onSaveAndContinue}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? t('common.saving') : t('eventForm.parkrunPromptSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
