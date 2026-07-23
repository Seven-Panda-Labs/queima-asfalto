import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { EventMedia } from '../../types/EventMedia'
import { stepMediaIndex, swipeDirection } from './eventMediaLightbox'

type EventMediaLightboxProps = {
  items: EventMedia[]
  activeIndex: number | null
  eventName: string
  onClose: () => void
  onActiveIndexChange: (index: number) => void
}

const navButtonClassName =
  'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/75 text-2xl leading-none text-white shadow-lg ring-1 ring-white/30 transition hover:bg-black/90 disabled:pointer-events-none disabled:opacity-0'

const mediaClassName =
  'max-h-[calc(100dvh-4.75rem)] w-auto max-w-[min(96vw,calc(100dvw-6rem))] object-contain sm:max-w-[min(92vw,calc(100dvw-10rem))]'

export function EventMediaLightbox({
  items,
  activeIndex,
  eventName,
  onClose,
  onActiveIndexChange,
}: EventMediaLightboxProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const openedAtRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const isOpen = activeIndex !== null
  const currentItem = activeIndex === null ? null : items[activeIndex]
  const hasPrevious = activeIndex !== null && activeIndex > 0
  const hasNext = activeIndex !== null && activeIndex < items.length - 1

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      openedAtRef.current = Date.now()
      dialog.showModal()
      return
    }

    if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    videoRef.current?.pause()
  }, [activeIndex])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeIndex === null) return

      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault()
        onActiveIndexChange(stepMediaIndex(activeIndex, -1, items.length))
      }

      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault()
        onActiveIndexChange(stepMediaIndex(activeIndex, 1, items.length))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, hasNext, hasPrevious, isOpen, items.length, onActiveIndexChange])

  const handleDialogClose = () => {
    onClose()
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return
    if (Date.now() - openedAtRef.current < 300) return
    onClose()
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (activeIndex === null || !touchStartRef.current) return

    const touch = event.changedTouches[0]
    if (!touch) return

    const direction = swipeDirection(
      touchStartRef.current.x,
      touchStartRef.current.y,
      touch.clientX,
      touch.clientY,
    )
    touchStartRef.current = null

    if (direction === 'previous' && hasPrevious) {
      onActiveIndexChange(stepMediaIndex(activeIndex, -1, items.length))
      return
    }

    if (direction === 'next' && hasNext) {
      onActiveIndexChange(stepMediaIndex(activeIndex, 1, items.length))
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={
        currentItem && activeIndex !== null
          ? t('eventMedia.viewerLabel', {
              current: activeIndex + 1,
              total: items.length,
            })
          : undefined
      }
      className="fixed inset-0 z-[1100] m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/90 open:flex open:flex-col"
      onClose={handleDialogClose}
      onClick={handleBackdropClick}
    >
      {currentItem && activeIndex !== null ? (
        <div
          className="flex h-full min-h-0 w-full flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 bg-black/60 px-4 py-3 text-white backdrop-blur-sm">
            <p className="text-sm font-semibold sm:text-base">
              {t('eventMedia.viewerLabel', {
                current: activeIndex + 1,
                total: items.length,
              })}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              {t('eventMedia.closeLightbox')}
            </button>
          </header>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-3 sm:px-16"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={() => onActiveIndexChange(stepMediaIndex(activeIndex, -1, items.length))}
              disabled={!hasPrevious}
              aria-label={t('eventMedia.previousMemory')}
              className={`${navButtonClassName} left-2 sm:left-4`}
            >
              ‹
            </button>

            <div className="flex h-full w-full items-center justify-center">
              {currentItem.type === 'photo' ? (
                <img
                  src={currentItem.downloadUrl}
                  alt={t('eventMedia.photoAlt', { name: eventName })}
                  className={mediaClassName}
                />
              ) : (
                <video
                  ref={videoRef}
                  key={currentItem.id}
                  src={currentItem.downloadUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className={mediaClassName}
                  aria-label={t('eventMedia.videoLabel', { name: eventName })}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => onActiveIndexChange(stepMediaIndex(activeIndex, 1, items.length))}
              disabled={!hasNext}
              aria-label={t('eventMedia.nextMemory')}
              className={`${navButtonClassName} right-2 sm:right-4`}
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
