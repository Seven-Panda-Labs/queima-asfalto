import { describe, expect, it } from 'vitest'
import { totalParticipantsFromLastDavengoPage } from '../../functions/src/connectors/davengo.js'

describe('totalParticipantsFromLastDavengoPage', () => {
  it('uses rankTotal from the last row on the final page', () => {
    const results = [
      { firstName: 'Anna', lastName: 'Müller', rankTotal: '1' },
      { firstName: 'Bob', lastName: 'Schmidt', rankTotal: '218' },
    ]
    expect(totalParticipantsFromLastDavengoPage(results)).toBe(218)
  })

  it('returns undefined for an empty page', () => {
    expect(totalParticipantsFromLastDavengoPage([])).toBeUndefined()
  })
})
