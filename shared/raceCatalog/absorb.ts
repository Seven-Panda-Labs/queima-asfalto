import { nextRaceDateOf } from './schedule.js'
import { nameTokensOf } from './nameTokens.js'
import type { RaceCatalogEdition, RaceCatalogEntry } from './types.js'

/**
 * The survivor of a merge, holding what both entries knew.
 *
 * A merge used to be a pointer and nothing else: the entry that went kept its
 * editions, its results pages, its fee and its official site, and none of it
 * was reachable any more. Measured on a real instance, four S25 entries were
 * linked into one and the visible one held a single 2023 edition, while the
 * three 2026 and 2027 editions, two results pages, a fee and a timezone sat
 * inside the copies. The harvest has always folded what it reads into the
 * entry it recognises (`mergeIntoCatalog`); this is the same act for the two
 * merges a person makes, from the duplicates queue and by hand.
 *
 * The survivor wins every conflict. It was chosen, so its name, its town, its
 * review state and its own values stand, and what the other entry had only
 * fills what the survivor does not have. The exception is a list, where the
 * union is plainly right: a distance somebody offers is offered, a word in the
 * other name is a word to find this race by, and an operator's "these two are
 * different races" holds whoever it was written on.
 */
export function absorb(
  survivor: RaceCatalogEntry,
  dropped: RaceCatalogEntry,
  today: string,
): RaceCatalogEntry {
  const editions = mergeEditions(survivor.editions ?? [], dropped.editions ?? [])
  const disciplines = [...new Set([...survivor.disciplines, ...dropped.disciplines])]
  const tokens = [
    ...new Set([
      ...nameTokensOf(survivor.name, survivor.city),
      ...(dropped.nameTokens ?? nameTokensOf(dropped.name, dropped.city)),
    ]),
  ]
  const keptApart = [...new Set([...(survivor.notDuplicateOf ?? []), ...(dropped.notDuplicateOf ?? [])])]

  return {
    ...survivor,
    disciplines,
    nameTokens: tokens,
    entryMethod: survivor.entryMethod === 'unknown' ? dropped.entryMethod : survivor.entryMethod,
    officialUrl: survivor.officialUrl ?? dropped.officialUrl,
    registrationUrl: survivor.registrationUrl ?? dropped.registrationUrl,
    typicalRaceMonth: survivor.typicalRaceMonth ?? dropped.typicalRaceMonth,
    typicalWindowNote: survivor.typicalWindowNote ?? dropped.typicalWindowNote,
    timezone: survivor.timezone ?? dropped.timezone,
    latitude: survivor.latitude ?? dropped.latitude,
    longitude: survivor.longitude ?? dropped.longitude,
    ...(keptApart.length > 0 ? { notDuplicateOf: keptApart } : {}),
    ...(editions.length > 0
      ? { editions, ...(nextRaceDateOf(editions, today) ? { nextRaceDate: nextRaceDateOf(editions, today) } : {}) }
      : {}),
  }
}

/**
 * Every year both entries know, once each.
 *
 * A year only the other entry had arrives whole. A year both had keeps the
 * survivor's values and fills its gaps: the day, the gates, the timezone, the
 * fee and the results page each come from wherever they exist, and the
 * survivor's win where both do.
 */
function mergeEditions(
  survivor: readonly RaceCatalogEdition[],
  dropped: readonly RaceCatalogEdition[],
): RaceCatalogEdition[] {
  const byYear = new Map<number, RaceCatalogEdition>()
  for (const edition of survivor) byYear.set(edition.year, edition)

  for (const edition of dropped) {
    const held = byYear.get(edition.year)
    if (!held) {
      byYear.set(edition.year, edition)
      continue
    }
    byYear.set(edition.year, {
      ...held,
      raceDate: held.raceDate ?? edition.raceDate,
      registrationOpensAt: held.registrationOpensAt ?? edition.registrationOpensAt,
      registrationClosesAt: held.registrationClosesAt ?? edition.registrationClosesAt,
      lotteryDrawAt: held.lotteryDrawAt ?? edition.lotteryDrawAt,
      timezone: held.timezone ?? edition.timezone,
      resultsUrl: held.resultsUrl ?? edition.resultsUrl,
      runnerConfirmedAt: held.runnerConfirmedAt ?? edition.runnerConfirmedAt,
      // A fee is an amount and a currency, so they travel together or not at
      // all: 40 with the other entry's EUR is not a price anybody published.
      ...(held.typicalFee === undefined && edition.typicalFee !== undefined
        ? { typicalFee: edition.typicalFee, feeCurrency: edition.feeCurrency }
        : {}),
    })
  }

  return [...byYear.values()]
    .map((edition) => Object.fromEntries(Object.entries(edition).filter(([, value]) => value !== undefined)) as RaceCatalogEdition)
    .sort((left, right) => left.year - right.year)
}
