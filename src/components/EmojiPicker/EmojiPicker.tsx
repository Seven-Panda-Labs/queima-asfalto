import { Suspense, lazy, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const EmojiPickerPanel = lazy(() => import('./EmojiPickerPanel'))

type EmojiPickerProps = {
  id?: string
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ id, value, onChange }: EmojiPickerProps) {
  const { t } = useTranslation()
  const fallbackId = useId()
  const triggerId = id ?? fallbackId
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('emojiPicker.choose')}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-start text-sm transition-colors hover:bg-background"
      >
        <span className="text-2xl" aria-hidden>
          {value || '🙂'}
        </span>
        <span className="text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('emojiPicker.choose')}
          className="absolute z-20 mt-1 w-[352px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-2 shadow-lg"
        >
          <Suspense
            fallback={
              <div className="flex h-[400px] w-full items-center justify-center text-sm text-muted">
                {t('common.loading')}
              </div>
            }
          >
            <EmojiPickerPanel
              onSelect={(emoji) => {
                onChange(emoji)
                setOpen(false)
              }}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  )
}
