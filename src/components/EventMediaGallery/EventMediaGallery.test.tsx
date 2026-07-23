import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { EventMedia } from '../../types/EventMedia'
import { EventMediaGallery } from './EventMediaGallery'

beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
    }
  }

  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    }
  }
})

afterEach(() => {
  cleanup()
})

const baseItem = {
  eventId: 'event-1',
  userId: 'user-1',
  storagePath: 'users/user-1/events/event-1/media/photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  createdAt: new Date('2026-01-01T00:00:00Z'),
} satisfies Omit<EventMedia, 'id' | 'type' | 'downloadUrl'>

const photo: EventMedia = {
  ...baseItem,
  id: 'photo-1',
  type: 'photo',
  downloadUrl: 'https://example.com/photo.jpg',
}

const video: EventMedia = {
  ...baseItem,
  id: 'video-1',
  type: 'video',
  downloadUrl: 'https://example.com/video.mp4',
  mimeType: 'video/mp4',
  durationSeconds: 12,
}

function renderGallery(items: EventMedia[]) {
  const onRequestDelete = vi.fn()

  render(
    <EventMediaGallery
      items={items}
      eventName="Berlin Marathon"
      itemToDelete={null}
      onRequestDelete={onRequestDelete}
      onConfirmDelete={vi.fn()}
      onCancelDelete={vi.fn()}
    />,
  )

  return { onRequestDelete }
}

describe('EventMediaGallery', () => {
  it('opens the lightbox when a thumbnail is clicked', () => {
    renderGallery([photo])

    fireEvent.click(screen.getByRole('button', { name: 'Ver foto de Berlin Marathon' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Memória 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Memória de Berlin Marathon' })).toBeInTheDocument()
  })

  it('keeps the closed dialog out of the layout', () => {
    renderGallery([photo])

    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(dialog).not.toHaveClass('flex')
    expect(dialog).toHaveClass('open:flex')
  })

  it('does not open the lightbox when delete is clicked', () => {
    const { onRequestDelete } = renderGallery([photo])

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
    expect(onRequestDelete).toHaveBeenCalledWith(photo)
  })

  it('navigates between memories in the lightbox', () => {
    renderGallery([photo, video])

    fireEvent.click(screen.getByRole('button', { name: 'Ver foto de Berlin Marathon' }))
    fireEvent.click(screen.getByRole('button', { name: 'Memória seguinte' }))

    expect(screen.getByText('Memória 2 de 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Vídeo de Berlin Marathon')).toBeInTheDocument()
  })

  it('navigates with a horizontal swipe gesture', () => {
    renderGallery([photo, video])

    fireEvent.click(screen.getByRole('button', { name: 'Ver foto de Berlin Marathon' }))

    const stage = screen.getByRole('dialog').querySelector('div.relative.flex.min-h-0.flex-1')
    expect(stage).not.toBeNull()

    fireEvent.touchStart(stage!, {
      changedTouches: [{ clientX: 180, clientY: 200 }],
    })
    fireEvent.touchEnd(stage!, {
      changedTouches: [{ clientX: 100, clientY: 205 }],
    })

    expect(screen.getByText('Memória 2 de 2')).toBeInTheDocument()
  })
})
