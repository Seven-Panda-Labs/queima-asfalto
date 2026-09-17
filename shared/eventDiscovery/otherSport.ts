/**
 * Whether a name reads as something other than a running race.
 *
 * A proposal, never a decision. The catalog is fed by nine calendars that sell
 * triathlons and charity walks beside the races, and an operator has no way to
 * find those except by reading five thousand rows. This finds the candidates;
 * a person answers, and `retiredReason` records the answer.
 *
 * It must not be turned into a rule. Measured on a real instance: 225 live
 * entries carry a walking word **and** a running one, and they are running
 * races with a walk beside them, "Wiler-Herbstlauf + Nordic Walking", "Run and
 * Walk Bern", "City cross run & walk". A rule that excluded by name would take
 * those out and nobody would notice until a runner could not find their race.
 */

/** Sports that are not running, and are hardly ever part of a running name. */
const ANOTHER_SPORT =
  /(?:\b(?:tri|du|aqua)athlon\b|triatl|duatl|swimrun|schwimm|\bradrennen\b|\bradtour\b|\bmtb\b|mountainbike|\bbike\b|\bcycling\b|ciclis|inline|skating|rudern|\bkanu\b|kayak|paddel|equestr)/i

/** Walking, which a running race often carries beside its own name. */
const A_WALK =
  /\b(?:walk|walking|nordic|wander\w*|wandel|caminhad\w*|marcha|hike|hiking|trekking)\b/i

/**
 * What says a race is run.
 *
 * Not word-anchored on the German side: "lauf" is a suffix there, and
 * "Herbstlauf", "Nikolauslauf" and "Crosslauf" are the names that made the
 * first version of this flag half the walks it should have left alone.
 */
const A_RUN =
  /(?:lauf|läufe|läufer|marathon|maraton|\brun\b|\brunning\b|corrida|carrera|\bcourse\b|cursa|\bjog|trail|meile|\bmile|milhas|\bkm\b|\d+\s*k\b)/i

export function readsAsAnotherSport(name: string): boolean {
  if (ANOTHER_SPORT.test(name)) return true
  return A_WALK.test(name) && !A_RUN.test(name)
}

/**
 * The words worth asking the server for, since Firestore cannot match a
 * pattern. Ten is the limit of one `array-contains-any`, and the reading above
 * is what decides among what comes back: a word missing here is a candidate
 * not shown, never a wrong one shown.
 */
export const OTHER_SPORT_WORDS = [
  'triathlon',
  'duathlon',
  'swimrun',
  'walk',
  'walking',
  'nordic',
  'wandern',
  'wandertage',
  'hiking',
  'bike',
] as const
