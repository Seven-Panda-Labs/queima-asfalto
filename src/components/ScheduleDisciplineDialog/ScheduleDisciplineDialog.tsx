import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BucketListItem } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'
import { formatEventTypeLabel } from '../../i18n/formatters'

type ScheduleDisciplineDialogProps = {
  open: boolean
  item: BucketListItem | null
  onCancel: () => void
  onConfirm: (eventType: EventType) => void
}

export function ScheduleDisciplineDialog({
  open,
  item,
  onCancel,
  onConfirm,
}: ScheduleDisciplineDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<EventType | null>(null)

  useEffect(() => {
    if (open && item) {
      setSelected(item.disciplines[0] ?? null)
    }
  }, [open, item])

  if (!open || !item) return null

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-foreground/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-discipline-title"
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <h2 id="schedule-discipline-title" className="text-lg font-semibold text-foreground">
          {t('bucketList.scheduleDisciplineTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t('bucketList.scheduleDisciplineMessage', { name: item.name })}
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">{t('bucketList.scheduleDisciplineTitle')}</legend>
          {item.disciplines.map((discipline) => (
            <label
              key={discipline}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-background"
            >
              <input
                type="radio"
                name="schedule-discipline"
                value={discipline}
                checked={selected === discipline}
                onChange={() => setSelected(discipline)}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-semibold text-foreground">
                {formatEventTypeLabel(discipline)}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {t('common.schedule')}
          </button>
        </div>
      </div>
    </div>
  )
}
