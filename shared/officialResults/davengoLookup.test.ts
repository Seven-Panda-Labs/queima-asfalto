import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupDavengo } from '../../functions/src/connectors/davengo.js'

const EDITION = 'https://www.davengo.com/event/result/kanal-halbmarathon-2026'
const HALF = 'Halbmarathon - 21 km'
const SHORT = 'KanalRun - 7 km'

/** One edition, two distances: Zé ran the 7 km, a namesake the half. */
function stubDavengo(
  half: object[] = [{ firstName: 'Maria', lastName: 'Ninguém', nettoTime: '01:52:10', rankTotal: '80.' }],
) {
  const lists: Record<string, object[]> = {
    [HALF]: half,
    [SHORT]: [
      { firstName: 'Ana', lastName: 'Exemplo', nettoTime: '00:31:02', rankTotal: '1.' },
      { firstName: 'Zé', lastName: 'Ninguém', nettoTime: '00:38:38', rankTotal: '50.' },
      { firstName: 'Rui', lastName: 'Exemplo', nettoTime: '01:01:00', rankTotal: '192.' },
    ],
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { body: string }) => {
      const body = JSON.parse(init.body) as { term: string | null; category?: string }
      if (url.endsWith('/search/overview')) {
        return Response.json({ results: { [HALF]: 1, [SHORT]: 1 } })
      }
      const rows = lists[body.category ?? ''] ?? []
      const matching = body.term ? rows.filter((row) => JSON.stringify(row).includes(body.term!)) : rows
      return Response.json({ results: matching })
    }),
  )
}

describe('lookupDavengo', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('finds the runner from the edition link, in whichever distance they ran', async () => {
    stubDavengo()

    const candidates = await lookupDavengo(EDITION, { resultFirstName: 'Zé', resultLastName: 'Ninguém' })

    expect(candidates).toEqual([
      expect.objectContaining({ matchedName: 'Zé Ninguém', time: '00:38:38', position: 50, totalParticipants: 192 }),
    ])
  })

  it('finds them from a link to another distance of the same edition', async () => {
    stubDavengo()

    const candidates = await lookupDavengo(`${EDITION}/search?category=${encodeURIComponent(HALF)}`, {
      resultFirstName: 'Zé',
      resultLastName: 'Ninguém',
    })

    expect(candidates).toEqual([expect.objectContaining({ matchedName: 'Zé Ninguém', time: '00:38:38' })])
  })

  it('searches the distance the link names first, when the name is in two', async () => {
    stubDavengo([{ firstName: 'Zé', lastName: 'Ninguém', nettoTime: '01:59:00', rankTotal: '90.' }])

    const candidates = await lookupDavengo(`${EDITION}/search?category=${encodeURIComponent(SHORT)}`, {
      resultFirstName: 'Zé',
      resultLastName: 'Ninguém',
    })

    expect(candidates).toEqual([expect.objectContaining({ time: '00:38:38' })])
  })
})
