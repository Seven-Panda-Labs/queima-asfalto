import { describe, expect, it } from 'vitest'
import { anonymizedContribution } from './anonymize'
import { duplicateVoteId } from './duplicateVotes'
import { editionReportId } from './editionReports'

const UID = 'uid-ze-ninguem'
const STAND_IN = 'deleted-1'

describe('anonymizedContribution', () => {
  it('takes the uid out of a report and of its id', () => {
    const report = anonymizedContribution(
      editionReportId('pt-lisboa-meia', 2026, UID),
      { catalogRaceId: 'pt-lisboa-meia', year: 2026, uid: UID, raceDate: '2026-03-08' },
      UID,
      STAND_IN,
    )

    expect(report.id).toBe(editionReportId('pt-lisboa-meia', 2026, STAND_IN))
    expect(report.data).toEqual({
      catalogRaceId: 'pt-lisboa-meia',
      year: 2026,
      uid: STAND_IN,
      raceDate: '2026-03-08',
    })
  })

  it('does the same for a vote', () => {
    const vote = anonymizedContribution(duplicateVoteId('a__b', UID), { uid: UID, same: true }, UID, STAND_IN)

    expect(vote.id).toBe(duplicateVoteId('a__b', STAND_IN))
    expect(JSON.stringify(vote)).not.toContain(UID)
  })

  it('keeps a proposal id and drops the race it pointed at', () => {
    const proposal = anonymizedContribution(
      'auto-id',
      { uid: UID, name: 'Corrida do Zé', raceId: 'race-1' },
      UID,
      STAND_IN,
    )

    expect(proposal).toEqual({ id: 'auto-id', data: { uid: STAND_IN, name: 'Corrida do Zé' } })
  })
})
