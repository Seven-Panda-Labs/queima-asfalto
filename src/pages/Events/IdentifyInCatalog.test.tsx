import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { Event } from '../../types/Event'
import { IdentifyInCatalog } from './IdentifyInCatalog'

const searchRaceCatalog = vi.fn()
const identifyRaceInCatalog = vi.fn()

vi.mock('../../services/raceCatalog', () => ({
  searchRaceCatalog: (...args: unknown[]) => searchRaceCatalog(...args),
}))
vi.mock('../../services/raceIdentity', () => ({
  identifyRaceInCatalog: (...args: unknown[]) => identifyRaceInCatalog(...args),
}))
const proposeCatalogRace = vi.fn()
vi.mock('../../services/catalogProposals', () => ({
  proposeCatalogRace: (...args: unknown[]) => proposeCatalogRace(...args),
}))

const event = {
  id: 'event-1',
  userId: 'u1',
  name: 'Generali Berliner Halbmarathon',
  date: new Date('2026-04-06'),
  realDistance: 21.0975,
  eventType: 'km_21_1',
  location: 'Brandenburger Tor, Berlim',
  status: 'completed',
  createdAt: new Date('2026-04-07'),
  updatedAt: new Date('2026-04-07'),
} as Event

function entry(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
  return {
    id: 'de-berlin-generali-berliner-halbmarathon',
    name: 'GENERALI BERLINER HALBMARATHON',
    country: 'DE',
    city: 'Berlin',
    disciplines: ['km_21_1'],
    entryMethod: 'unknown',
    review: 'reviewed',
    source: 'generali-berliner-halbmarathon.de',
    nextRaceDate: '2027-04-11',
    ...overrides,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('IdentifyInCatalog', () => {
  it('says nothing about a race already linked', () => {
    const { container } = render(<IdentifyInCatalog event={event} userId="u1" linked />)
    expect(container).toBeEmptyDOMElement()
  })

  it('searches on the event s own name when opened', async () => {
    searchRaceCatalog.mockResolvedValue([entry()])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))

    // Every word, the generic one last, and the ranking decides what shows.
    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ nameTokens: ['generali', 'berliner', 'halbmarathon'] }),
      ),
    )
    expect(await screen.findByText('GENERALI BERLINER HALBMARATHON')).toBeInTheDocument()
  })

  it('prefers the entry that offers the distance this event was', async () => {
    // The name cannot separate the Maratona de Lisboa from the Meia Maratona
    // de Lisboa, and the event knows which one it ran.
    searchRaceCatalog.mockResolvedValue([
      entry({ id: 'pt-lisboa-maratona', name: 'Maratona de Lisboa', disciplines: ['km_42_2'] }),
      entry({ id: 'pt-lisboa-meia', name: 'Meia Maratona de Lisboa', disciplines: ['km_21_1'] }),
    ])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))
    await screen.findByText('Meia Maratona de Lisboa')

    const shown = [...document.querySelectorAll('li')].map((row) => row.textContent ?? '')
    expect(shown[0]).toContain('Meia Maratona de Lisboa')
  })

  it('looks past the next edition, because identity is not a date', async () => {
    searchRaceCatalog.mockResolvedValue([])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))

    // The discovery search skips an entry with no date ahead. A race being
    // identified is wanted whether or not its next edition is known.
    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ from: '1000-01-01' }),
      ),
    )
  })

  it('links only what the runner picked', async () => {
    searchRaceCatalog.mockResolvedValue([entry(), entry({ id: 'de-berlin-other', name: 'Berliner Neujahrslauf' })])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))
    await screen.findByText('Berliner Neujahrslauf')
    // The second candidate, to prove it is the choice and not the first row.
    fireEvent.click(screen.getAllByRole('button', { name: 'É esta' })[1]!)

    await waitFor(() =>
      expect(identifyRaceInCatalog).toHaveBeenCalledWith('u1', event, 'de-berlin-other'),
    )
  })

  it('lets the runner search for another word', async () => {
    searchRaceCatalog.mockResolvedValue([])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))
    await screen.findByText(/Nada no catálogo/)

    fireEvent.change(screen.getByLabelText(/Procurar pelo nome/), {
      target: { value: 'Teltowkanal' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Procurar pelo nome' }))

    await waitFor(() =>
      expect(searchRaceCatalog).toHaveBeenLastCalledWith(
        expect.objectContaining({ nameTokens: ['teltowkanal'] }),
      ),
    )
  })

  it('says so when the link could not be written', async () => {
    searchRaceCatalog.mockResolvedValue([entry()])
    identifyRaceInCatalog.mockRejectedValueOnce(new Error('denied'))
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)

    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'É esta' }))

    expect(await screen.findByText('Não foi possível ligar.')).toBeInTheDocument()
  })
})

describe('a race the catalog does not hold', () => {
  async function openProposal() {
    searchRaceCatalog.mockResolvedValue([])
    render(<IdentifyInCatalog event={event} userId="u1" linked={false} />)
    fireEvent.click(screen.getByRole('button', { name: /não está ligada/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Propor esta prova/ }))
  }

  it('asks only for what the event does not already say', async () => {
    await openProposal()

    // The town comes off the location, which is one free-text field: the event
    // says "Brandenburger Tor, Berlim" and the catalog needs them apart.
    expect(screen.getByLabelText('Terra')).toHaveValue('Brandenburger Tor')
    expect(screen.getByLabelText('País')).toHaveValue('')
  })

  it('proposes the race with the day and distance the event already knows', async () => {
    await openProposal()

    fireEvent.change(screen.getByLabelText('Terra'), { target: { value: 'Berlin' } })
    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'Alemanha' } })
    fireEvent.click(screen.getByRole('button', { name: 'Propor ao catálogo' }))

    // The country is read the way the sources are read, so a name works.
    await waitFor(() =>
      expect(proposeCatalogRace).toHaveBeenCalledWith('u1', {
        name: 'Generali Berliner Halbmarathon',
        city: 'Berlin',
        country: 'DE',
        raceDate: '2026-04-06',
        disciplines: ['km_21_1'],
      }),
    )
    expect(await screen.findByText(/Proposta guardada/)).toBeInTheDocument()
  })

  it('refuses a country it cannot read, rather than filing XX', async () => {
    await openProposal()

    fireEvent.change(screen.getByLabelText('País'), { target: { value: 'Freedonia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Propor ao catálogo' }))

    // The catalog stores XX for a missing country and dedup compares it first,
    // so two XX races in a town called Porto would merge into one.
    expect(await screen.findByText(/Não conseguimos ler esse país/)).toBeInTheDocument()
    expect(proposeCatalogRace).not.toHaveBeenCalled()
  })
})
