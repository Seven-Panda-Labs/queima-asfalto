import { describe, expect, it } from 'vitest'
import {
  aggregatePodiums,
  competitionDistanceKm,
  dedupeEditions,
  formatSeconds,
  isOpenRunningCompetition,
  matchDistance,
  namesAgreeAcrossYears,
  parseEventOverview,
  parsePodiumTime,
  parseYearIndex,
  podiumHits,
  type EditionPodium,
} from './podiumScout.js'

/** Hand-written in the portal's shape. Every name here is fictional. */
const YEAR_INDEX = `
<table id="datatabelle">
<thead><tr><th></th><th class="all brname"></th><th></th><th></th></tr></thead>
<tbody>
<tr> <td>30.08.2026</td> <td><a href="va_ergebnisse.php?id=968">24. Gro&szlig; Musterdorfer 2-Seen-Lauf</a></td> <td>14476 Gro&szlig; Musterdorf</td> <td></td> </tr>
<tr> <td>29.08.2026</td> <td><a href="va_ergebnisse.php?id=985">Freiwasser Musterbach</a></td> <td>Musterbach</td> <td></td> </tr>
<tr> <td>02.08.2026</td> <td><a href="va_ergebnisse.php?id=919">57. Musterseeschwimmen</a></td> <td>17192 Musterhausen am See</td> <td></td> </tr>
</tbody>
</table>
`

function panel(match: number, title: string, body: string): string {
  return `
<div class="panel panel-default clickable-panel" data-href="https://www.strassenlauf.org/va_ergebnisse.php?id=1&match=${match}" title="${title}">
<div class="panel-heading"><a href="https://www.strassenlauf.org/va_ergebnisse.php?id=1&match=${match}">${title}</a></div>
<div class="panel-body">
<table class="table table-striped table-hover" id="datatabelle1">
<thead><tr><th class="all"><b>Rg</b></th><th class="all"><b>Name</b></th><th><b>Verein</b></th><th><b>Zeit</b></th></tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>
</div>`
}

const OVERVIEW = [
  panel(
    0,
    '10 km Laufen',
    `<tr><td>1</td><td>Max Mustermann</td><td>SV Musterstadt</td><td>00:33:12</td></tr>
<tr><td>2</td><td>Klaus Beispiel</td><td></td><td>00:35:40</td></tr>
<tr><td>3</td><td>Peter Niemand</td><td>LG Mustertal</td><td>00:38:05</td></tr>
<tr><td></td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>1</td><td>Erika Mustermann</td><td></td><td>00:41:19</td></tr>
<tr><td>2</td><td>Petra Beispiel</td><td></td><td>00:44:02</td></tr>`,
  ),
  panel(
    1,
    '5 km Frauenlauf',
    `<tr><td>1</td><td>Anna Musterfrau</td><td></td><td>00:20:54</td></tr>
<tr><td>2</td><td>Sara Niemand</td><td></td><td>00:21:16</td></tr>
<tr><td>3</td><td>Lena Beispiel</td><td></td><td>00:21:39</td></tr>`,
  ),
  panel(
    2,
    '5 km Walking',
    `<tr><td>1</td><td>Otto Musterreich</td><td></td><td>00:39:14</td></tr>`,
  ),
].join('\n')

describe('parseYearIndex', () => {
  it('reads the day, the event id and the postcode', () => {
    const editions = parseYearIndex(YEAR_INDEX)

    expect(editions).toHaveLength(3)
    expect(editions[0]).toEqual({
      eventId: '968',
      date: '2026-08-30',
      name: '24. Groß Musterdorfer 2-Seen-Lauf',
      place: '14476 Groß Musterdorf',
      postcode: '14476',
    })
  })

  it('leaves a place without a postcode readable', () => {
    expect(parseYearIndex(YEAR_INDEX)[1]).toMatchObject({
      place: 'Musterbach',
      postcode: null,
    })
  })
})

describe('parseEventOverview', () => {
  it('splits the two podiums on the empty row and reads men first', () => {
    const competitions = parseEventOverview(OVERVIEW)
    const tenK = competitions.find((entry) => entry.competition === '10 km Laufen')

    expect(tenK?.groups).toHaveLength(2)
    expect(tenK?.groups[0]?.group).toBe('m')
    expect(tenK?.groups[0]?.places).toHaveLength(3)
    expect(tenK?.groups[0]?.places[2]).toEqual({
      position: 3,
      name: 'Peter Niemand',
      time: '00:38:05',
      seconds: 2285,
    })
    expect(tenK?.groups[1]?.group).toBe('w')
    expect(tenK?.groups[1]?.places).toHaveLength(2)
  })

  it('leaves a single podium unlabelled', () => {
    const competitions = parseEventOverview(OVERVIEW)
    const women = competitions.find((entry) => entry.competition === '5 km Frauenlauf')

    expect(women?.groups).toHaveLength(1)
    expect(women?.groups[0]?.group).toBe('unknown')
  })

  it('reads every competition on the page', () => {
    expect(parseEventOverview(OVERVIEW).map((entry) => entry.competition)).toEqual([
      '10 km Laufen',
      '5 km Frauenlauf',
      '5 km Walking',
    ])
  })
})

describe('parsePodiumTime', () => {
  it('reads the portal\'s hh:mm:ss and a bare mm:ss', () => {
    expect(parsePodiumTime('00:38:05')).toBe(2285)
    expect(parsePodiumTime('19:42')).toBe(1182)
    expect(parsePodiumTime('01:02:03')).toBe(3723)
  })

  it('refuses what is not a time', () => {
    expect(parsePodiumTime('DNF')).toBeNull()
    expect(parsePodiumTime('')).toBeNull()
  })
})

describe('formatSeconds', () => {
  it('drops the hour when there is none', () => {
    expect(formatSeconds(1182)).toBe('19:42')
    expect(formatSeconds(3723)).toBe('1:02:03')
  })
})

describe('isOpenRunningCompetition', () => {
  it('keeps a race an adult can enter', () => {
    expect(isOpenRunningCompetition('10 km Laufen')).toBe(true)
    expect(isOpenRunningCompetition('10 km extern')).toBe(true)
  })

  it('drops what is not an individual run', () => {
    expect(isOpenRunningCompetition('5 km Walking')).toBe(false)
    // How one organiser abbreviates Walking und Nordic Walking.
    expect(isOpenRunningCompetition('5km W-NW')).toBe(false)
    expect(isOpenRunningCompetition('5 km Nordic Walking')).toBe(false)
    expect(isOpenRunningCompetition('10 Km: Mannschaftswertung')).toBe(false)
    expect(isOpenRunningCompetition('5 km Kinderwagenlauf')).toBe(false)
  })

  it('drops the bike ride that finishes a 10 km in 24 minutes', () => {
    expect(isOpenRunningCompetition('10km Radfahren')).toBe(false)
    expect(isOpenRunningCompetition('5km Radfahren')).toBe(false)
  })

  it('drops an age class', () => {
    expect(isOpenRunningCompetition('4,8km U40 m')).toBe(false)
    expect(isOpenRunningCompetition('3,2km U16,U18,U20 w')).toBe(false)
    expect(isOpenRunningCompetition('Lauf 16c Masters (W) ab W 30 oBBM 4 ca 5235m')).toBe(false)
  })

  it('drops a birth-year window, and keeps a plain edition year', () => {
    expect(isOpenRunningCompetition('5 km Laufen 2009-2011')).toBe(false)
    expect(isOpenRunningCompetition('800m Lauf 2015/2016')).toBe(false)
    // Written with nothing but a space between the two years.
    expect(isOpenRunningCompetition('5 km Lauf 2008 2010')).toBe(false)
    expect(isOpenRunningCompetition('10 km Lauf 2025')).toBe(true)
  })
})

describe('competitionDistanceKm', () => {
  it('reads the distance off the competition name', () => {
    expect(competitionDistanceKm('10 Km')).toBe(10)
    expect(competitionDistanceKm('9,6 km Laufen')).toBe(9.6)
    expect(competitionDistanceKm('1500m Lauf')).toBe(1.5)
    expect(competitionDistanceKm('Ergebnis-Übersicht')).toBeNull()
  })
})

describe('matchDistance', () => {
  it('counts a nearly right distance as the one wanted', () => {
    expect(matchDistance(9.6, [5, 10], 5)).toBe(10)
    expect(matchDistance(5, [5, 10], 5)).toBe(5)
    expect(matchDistance(4.8, [5, 10], 5)).toBe(5)
  })

  it('refuses one that is too far off', () => {
    // A share of the distance, so 5,6 km is out and 9,8 km is in.
    expect(matchDistance(5.6, [5, 10], 5)).toBeNull()
    expect(matchDistance(9.8, [5, 10], 5)).toBe(10)
    expect(matchDistance(7.5, [5, 10], 5)).toBeNull()
    expect(matchDistance(1.5, [5, 10], 5)).toBeNull()
  })
})

describe('namesAgreeAcrossYears', () => {
  it('holds through a spelling that drifted', () => {
    expect(
      namesAgreeAcrossYears(
        '31. Musterdorfer Waldcross im Natursportpark Musterfeld',
        '32. Musterdorfer Waldcross im Natursportpark Musterfelde',
      ),
    ).toBe(true)
  })

  it('holds through the edition number', () => {
    expect(
      namesAgreeAcrossYears('23. Groß Musterdorfer 2-Seen-Lauf', '24. Groß Musterdorfer 2-Seen-Lauf'),
    ).toBe(true)
  })

  it('keeps two races of the same club apart', () => {
    expect(namesAgreeAcrossYears('61. SCC Cross Country', '4. SCC Waldlauf')).toBe(false)
  })
})

function edition(name: string, date: string, thirdSeconds: number | null): EditionPodium {
  const places = [
    { position: 1, name: 'Max Mustermann', time: '00:33:12', seconds: 1992 },
    { position: 2, name: 'Klaus Beispiel', time: '00:35:40', seconds: 2140 },
  ]
  if (thirdSeconds != null) {
    places.push({
      position: 3,
      name: 'Peter Niemand',
      time: formatSeconds(thirdSeconds),
      seconds: thirdSeconds,
    })
  }

  return {
    edition: {
      // The portal gives every edition its own id, so two years of one race
      // never share it.
      eventId: `${date}|${name}`,
      date,
      name,
      place: '14476 Groß Musterdorf',
      postcode: '14476',
    },
    competition: '10 km Laufen',
    match: '3',
    finishers: null,
    distanceKm: 10,
    nominalKm: 10,
    group: 'm',
    places,
    sourceUrl: `https://www.strassenlauf.org/va_ergebnisse.php?id=${date.slice(0, 4)}`,
  }
}

describe('aggregatePodiums', () => {
  it('gathers the editions of one race into one row', () => {
    const stats = aggregatePodiums([
      edition('23. Groß Musterdorfer 2-Seen-Lauf', '2025-09-07', 2400),
      edition('24. Groß Musterdorfer 2-Seen-Lauf', '2026-08-30', 2285),
    ])

    expect(stats).toHaveLength(1)
    expect(stats[0]).toMatchObject({
      raceName: 'Groß Musterdorfer 2-Seen-Lauf',
      editions: 2,
      lastDate: '2026-08-30',
      thirdSeconds: [2285, 2400],
      openPodiums: 0,
    })
  })

  it('names the race as its most recent edition does', () => {
    const stats = aggregatePodiums([
      edition('32. Musterdorfer Waldcross im Natursportpark Musterfelde', '2026-08-30', 2285),
      edition('31. Musterdorfer Waldcross im Natursportpark Musterfeld', '2025-08-30', 2400),
    ])

    expect(stats).toHaveLength(1)
    expect(stats[0]?.raceName).toBe('Musterdorfer Waldcross im Natursportpark Musterfelde')
  })

  it('counts an edition with no third finisher as an open podium', () => {
    const stats = aggregatePodiums([
      edition('23. Groß Musterdorfer 2-Seen-Lauf', '2025-09-07', null),
      edition('24. Groß Musterdorfer 2-Seen-Lauf', '2026-08-30', 2285),
    ])

    expect(stats[0]).toMatchObject({ editions: 2, thirdSeconds: [2285], openPodiums: 1 })
  })

  it('keeps two different races apart', () => {
    const stats = aggregatePodiums([
      edition('61. SCC Cross Country', '2025-11-29', 2400),
      edition('4. SCC Waldlauf', '2025-05-29', 2285),
    ])

    expect(stats).toHaveLength(2)
  })
})

/** The portal ends a results page with this, and it is a clickable panel too. */
const SIGN_UP_AGAIN_PANEL = `
<div class="panel panel-default clickable-panel" data-href="/va_details.php?id=964">
  <div class="panel-heading"><h3 class="panel-title">Gleich wieder anmelden</h3></div>
  <div class="panel-body"><p>Hier k&ouml;nnen Sie sich gleich anmelden</p></div>
</div>`

describe('parseEventOverview with the sign-up panel in the middle', () => {
  it('does not let a titleless panel swallow the next competition', () => {
    const competitions = parseEventOverview(
      [
        panel(0, '10 km Laufen', '<tr><td>1</td><td>Max Mustermann</td><td></td><td>00:33:12</td></tr>'),
        SIGN_UP_AGAIN_PANEL,
        panel(1, '5 km Laufen', '<tr><td>1</td><td>Klaus Beispiel</td><td></td><td>00:17:41</td></tr>'),
      ].join('\n'),
    )

    expect(competitions.map((entry) => entry.competition)).toEqual(['10 km Laufen', '5 km Laufen'])
    expect(competitions[1]?.groups[0]?.places[0]?.name).toBe('Klaus Beispiel')
  })
})

describe('parseEventOverview match index', () => {
  it('reads the index the results API needs', () => {
    expect(parseEventOverview(OVERVIEW).map((entry) => entry.match)).toEqual(['0', '1', '2'])
  })
})

describe('dedupeEditions', () => {
  it('keeps one podium per edition when a distance is classified twice', () => {
    const race = edition('9. Musterlauf', '2026-09-26', 2400)
    const externalRanking: EditionPodium = {
      ...race,
      competition: '10 km extern',
      places: race.places.map((place) => ({ ...place, seconds: place.seconds + 60 })),
    }

    const kept = dedupeEditions([externalRanking, race])

    expect(kept).toHaveLength(1)
    expect(kept[0]?.competition).toBe('10 km Laufen')
  })

  it('prefers a filled podium over an empty place', () => {
    const filled = edition('9. Musterlauf', '2026-09-26', 2400)
    const twoFinishers: EditionPodium = { ...filled, competition: '10 km extern', places: filled.places.slice(0, 2) }

    expect(dedupeEditions([twoFinishers, filled])[0]?.competition).toBe('10 km Laufen')
  })
})

describe('podiumHits', () => {
  it('counts the editions a mark would have reached the podium in', () => {
    const [stats] = aggregatePodiums([
      edition('22. Musterlauf', '2024-09-07', 2400),
      edition('23. Musterlauf', '2025-09-07', 2100),
      edition('24. Musterlauf', '2026-09-07', null),
    ])

    // 2285 beats the 2400 edition, loses to the 2100 one, and walks onto the
    // podium nobody filled.
    expect(podiumHits(stats!, 2285)).toBe(2)
  })
})
