import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EntryPrefill } from '../../domain/entryPrefill'
import type { BucketListItem } from '../../types/BucketListItem'
import { ScheduleRaceDialog } from './ScheduleRaceDialog'

afterEach(cleanup)

function wish(overrides: Partial<BucketListItem> = {}): BucketListItem {
  return {
    id: 'wish-1',
    userId: 'u1',
    raceId: 'race-1',
    name: 'Maratona do Porto',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

const offer: EntryPrefill = {
  year: 2026,
  raceDate: '2026-11-08',
  source: 'acorrer.pt',
  assertable: false,
}

describe('ScheduleRaceDialog', () => {
  it('offers the catalog date, and says it is the catalog talking', () => {
    render(
      <ScheduleRaceDialog
        open
        disciplines={['km_42_2']}
        item={wish()}
        offer={offer}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Data da prova')).toHaveTextContent('08')
    expect(screen.getByText(/Preenchido a partir do catálogo/)).toBeInTheDocument()
  })

  it('schedules with the day and the distance', () => {
    const onConfirm = vi.fn()
    render(
      <ScheduleRaceDialog
        open
        disciplines={['km_42_2']}
        item={wish()}
        offer={offer}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Agendar' }))

    expect(onConfirm).toHaveBeenCalledWith('km_42_2', '2026-11-08')
  })

  it('refuses to schedule a race with no date', () => {
    // The whole rule: a race whose next edition is not published stays a wish.
    const onConfirm = vi.fn()
    render(
      <ScheduleRaceDialog
        open
        disciplines={['km_42_2']}
        item={wish()}
        offer={null}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Agendar' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByText(/Diz a data da prova/)).toBeInTheDocument()
  })

  it('asks which distance only when the catalog offers a choice', () => {
    const { rerender } = render(
      <ScheduleRaceDialog
        open
        disciplines={['km_42_2']}
        item={wish()}
        offer={offer}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()

    rerender(
      <ScheduleRaceDialog
        open
        disciplines={['km_42_2', 'km_21_1']}
        item={wish()}
        offer={offer}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })
})
