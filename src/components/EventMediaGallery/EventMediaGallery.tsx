import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_MEDIA_PER_EVENT } from '../../constants/eventMedia'
import type { EventMedia } from '../../types/EventMedia'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'
import { EventMediaLightbox } from '../EventMediaLightbox/EventMediaLightbox'

type EventMediaGalleryProps = {
  items: EventMedia[]
  eventName: string
  loading?: boolean
  deletingId?: string | null
  itemToDelete: EventMedia | null
  onRequestDelete: (item: EventMedia) => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export function EventMediaGallery({
  items,
  eventName,
  loading = false,
  deletingId = null,
  itemToDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: EventMediaGalleryProps) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const lastFocusedTriggerRef = useRef<HTMLButtonElement | null>(null)

  const openLightbox = (index: number, trigger: HTMLButtonElement) => {
    lastFocusedTriggerRef.current = trigger
    setActiveIndex(index)
  }

  const closeLightbox = () => {
    setActiveIndex(null)
    requestAnimationFrame(() => {
      lastFocusedTriggerRef.current?.focus()
    })
  }

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">{t('eventMedia.empty')}</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-background"
          >
            <button
              type="button"
              onClick={(event) => openLightbox(index, event.currentTarget)}
              aria-label={
                item.type === 'photo'
                  ? t('eventMedia.openPhoto', { name: eventName })
                  : t('eventMedia.openVideo', { name: eventName })
              }
              className="relative block w-full cursor-zoom-in"
            >
              {item.type === 'photo' ? (
                <img
                  src={item.downloadUrl}
                  alt=""
                  aria-hidden
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <>
                  <video
                    src={item.downloadUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-square w-full object-cover"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/20 text-3xl text-white"
                    aria-hidden
                  >
                    ▶
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onRequestDelete(item)
              }}
              disabled={deletingId === item.id}
              className="absolute top-2 right-2 z-10 rounded-md bg-foreground/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
            >
              {deletingId === item.id ? t('confirmDialog.deleting') : t('common.delete')}
            </button>
          </figure>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted">
        {t('eventMedia.count', { count: items.length, max: MAX_MEDIA_PER_EVENT })}
      </p>

      <EventMediaLightbox
        items={items}
        activeIndex={activeIndex}
        eventName={eventName}
        onClose={closeLightbox}
        onActiveIndexChange={setActiveIndex}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title={t('eventMedia.deleteTitle')}
        message={
          itemToDelete ? t('eventMedia.deleteMessage', { name: eventName }) : ''
        }
        confirmLabel={t('common.delete')}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        loading={deletingId !== null}
      />
    </>
  )
}
