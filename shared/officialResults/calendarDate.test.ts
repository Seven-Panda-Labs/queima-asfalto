import { describe, expect, it } from 'vitest'
import {
  calendarDateIsoCandidates,
  calendarDateParkrunCandidates,
} from '../../functions/src/utils/time.js'

describe('calendarDateIsoCandidates', () => {
  it('includes adjacent days for local-midnight Firestore timestamps in UTC', () => {
    // 2023-05-20 00:00 CEST → 2023-05-19T22:00:00.000Z
    const eventDate = new Date('2023-05-19T22:00:00.000Z')

    expect(calendarDateIsoCandidates(eventDate)).toEqual([
      '2023-05-18',
      '2023-05-19',
      '2023-05-20',
    ])
    expect(calendarDateParkrunCandidates(calendarDateIsoCandidates(eventDate))).toContain(
      '20/05/2023',
    )
  })
})
