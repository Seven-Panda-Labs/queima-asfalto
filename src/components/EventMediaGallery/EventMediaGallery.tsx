import { useTranslation } from 'react-i18next'
import { MAX_MEDIA_PER_EVENT } from '../../constants/eventMedia'
import type { EventMedia } from '../../types/EventMedia'
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog'

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

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">{t('eventMedia.empty')}</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-background"
          >
            {item.type === 'photo' ? (
              <img
                src={item.downloadUrl}
                alt={t('eventMedia.photoAlt', { name: eventName })}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={item.downloadUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-square w-full object-cover"
                aria-label={t('eventMedia.videoLabel', { name: eventName })}
              />
            )}
            <button
              type="button"
              onClick={() => onRequestDelete(item)}
              disabled={deletingId === item.id}
              className="absolute top-2 right-2 rounded-md bg-foreground/70 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
            >
              {deletingId === item.id ? t('confirmDialog.deleting') : t('common.delete')}
            </button>
          </figure>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted">
        {t('eventMedia.count', { count: items.length, max: MAX_MEDIA_PER_EVENT })}
      </p>

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
