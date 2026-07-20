import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_MEDIA_PER_EVENT } from '../../constants/eventMedia'
import type { MediaValidationErrorCode } from '../../utils/mediaValidation'

type EventMediaUploadProps = {
  disabled?: boolean
  currentCount: number
  uploading?: boolean
  selectedFiles: File[]
  onSelectedFilesChange: (files: File[]) => void
  onUpload?: () => void
  uploadErrors?: Array<{ fileName: string; code: MediaValidationErrorCode }>
  showUploadButton?: boolean
}

export function EventMediaUpload({
  disabled = false,
  currentCount,
  uploading = false,
  selectedFiles,
  onSelectedFilesChange,
  onUpload,
  uploadErrors = [],
  showUploadButton = true,
}: EventMediaUploadProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickerError, setPickerError] = useState<string | null>(null)

  const slotsLeft = MAX_MEDIA_PER_EVENT - currentCount
  const canAddMore = slotsLeft > 0 && !disabled

  function handlePickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const combined = [...selectedFiles, ...files].slice(0, slotsLeft)
    if (combined.length < selectedFiles.length + files.length) {
      setPickerError(t('eventMedia.errors.limit_reached'))
    } else {
      setPickerError(null)
    }
    onSelectedFilesChange(combined)
  }

  function removeSelected(index: number) {
    onSelectedFilesChange(selectedFiles.filter((_, itemIndex) => itemIndex !== index))
    setPickerError(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canAddMore || uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60"
        >
          {t('eventMedia.addFiles')}
        </button>
        {showUploadButton && selectedFiles.length > 0 && onUpload ? (
          <button
            type="button"
            disabled={uploading || disabled}
            onClick={onUpload}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {uploading ? t('eventMedia.uploading') : t('eventMedia.uploadSelected')}
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handlePickFiles}
        />
      </div>

      <p className="text-xs text-muted">{t('eventMedia.limitsHint')}</p>

      {selectedFiles.length > 0 ? (
        <ul className="space-y-1 text-sm text-foreground">
          {selectedFiles.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeSelected(index)}
                className="shrink-0 text-xs font-semibold text-muted hover:text-foreground"
              >
                {t('common.remove')}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pickerError ? <p className="text-sm text-danger">{pickerError}</p> : null}

      {uploadErrors.map((failure) => (
        <p key={`${failure.fileName}-${failure.code}`} className="text-sm text-danger">
          {failure.fileName}: {t(`eventMedia.errors.${failure.code}`)}
        </p>
      ))}
    </div>
  )
}
