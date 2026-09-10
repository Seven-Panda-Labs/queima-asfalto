import type { RaceCatalogEntry } from '../raceCatalog/types.js'
import { slugify, stripEdition } from './identity.js'

/**
 * The same race, already in the catalog under another name.
 *
 * Names cannot carry this on their own. The catalog's curated entries were
 * written without a sponsor on purpose and every harvested name has one, and
 * some of them are not even in the same language: "Berlin Half Marathon" and
 * "GENERALI BERLINER HALBMARATHON" are one race and share almost no letters.
 *
 * And the day and the place cannot carry it either, which the Berlin marathon
 * weekend proves: "GENERALI 5K im Rahmen des BMW BERLIN-MARATHON" and "R5K Tour
 * Finale" are both 5 km, both in Berlin, both on 26/09/2026, and they are two
 * different races.
 *
 * So a merge takes **names that plainly agree**: the same day, the same city,
 * and one name containing the other once the sponsors, the edition and the town
 * are gone.
 *
 * A person's entry used to be enough on its own, on the theory that a harvest
 * turning up on its day with the organiser's own name for it was not news. It
 * was, and measurably: of the 160 folds in one instance only six had a checked
 * entry as the survivor and the names carried all six anyway, while the same
 * branch offered to fold a triathlon, a 5 km club run and a lake swim into the
 * Tierparklauf they share the 12th of September with. A checked entry is a
 * better survivor, not better evidence, so that pair is now a question for the
 * queue and no longer a merge.
 */

/** Sponsors and connectives, which is most of what differs between two names. */
const NOISE_WORDS =
  'bmw|generali|adidas|garmin|volvo|tcs|bnp|paribas|edp|nn|virgin|money|asics|brooks|hoka|puma|nike|presented|powered|by|im|rahmen|des|beim|der|die|das|le|la|el'

const NOISE = new RegExp(String.raw`\b(${NOISE_WORDS})\b`, 'giu')



/** "24h-Lauf" and "24-Stunden-Lauf" are one race, written by two sources. */
const HOURS = /(\d{1,3})\s*h\b/giu

function normalizeName(name: string): string {
  return slugify(stripEdition(name).replace(HOURS, '$1 stunden').replace(NOISE, ' ')).replace(
    /-+/g,
    '-',
  )
}

/**
 * The word for a race, stuck to the end of what the race is about.
 *
 * German compounds it: "Kannenstieglauf" is a run at the Kannenstieg and
 * "Herbstlauf" is one in autumn, and the same event is written "Lauf in den
 * Herbst" by the next source. Comparing the stem is what makes those the same
 * two words. Only when a stem is left: "Lauf" on its own stays "Lauf", and
 * "Marathon" stays a marathon while "Halbmarathon" becomes "halb".
 */
const RACE_WORD = /(?:lauf|laufen|run|running|marathon|maraton|corrida|trail|race)$/iu

/**
 * The same distance, in the languages the sources publish it in.
 *
 * "13. EDP Maratona de Lisboa" and "Lissabon Marathon" are one race, and a
 * German calendar naming a Portuguese one is the normal case rather than the
 * exception. A half stays a half: "Halbmarathon" reduces to "half" and
 * "Marathon" to "marathon", so the two never meet.
 */
const MARATHON = /^(?:marathons?|maratona|maraton|marat[oó]n)$/iu
const HALF = /^(?:halb|half|meia|media|mezza|semi|halv)$/iu

function stem(token: string): string {
  const stripped = token.replace(RACE_WORD, '')
  const root = stripped.length >= 4 ? stripped : token
  if (HALF.test(root)) return 'half'
  return MARATHON.test(root) ? 'marathon' : root
}

/**
 * The numbers a name carries, once the edition is off the front.
 *
 * Two names that are otherwise the same and disagree on a number are two
 * things: "Die Bergischen 5 Etappe 1" and "Etappe 2" are two stages of a stage
 * race, "Ironman 5150" and "Ironman 70.3" are two formats, and "Berlin 5K" is
 * not "Berlin 10K". The stage number is one character, so every filter that
 * works on word length drops it and the names come out identical.
 *
 * One side with no number says nothing: "Neckarsteiglauf" and
 * "Neckarsteiglauf 126K" are one race, and a source that leaves the distance
 * out of the name has not disagreed about it.
 */
/**
 * A four-digit year in a name is the edition, not the race.
 *
 * "S 25 Berlin" and "S 25 Berlin 2027" came out as two races because one side
 * had the number 2027 and the other did not, so a runner proposing the edition
 * they ran created a third entry for a race the catalog already held twice.
 */
const YEAR_IN_NAME = /^(?:19|20)\d\d$/

function numbersIn(name: string): Set<string> {
  const found = normalizeName(name).match(/\d+/g) ?? []
  return new Set(found.filter((number) => !YEAR_IN_NAME.test(number)))
}

function numbersRuleOut(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const here = numbersIn(left.name)
  const there = numbersIn(right.name)
  if (here.size === 0 || there.size === 0) return false
  if (here.size !== there.size) return true
  return [...here].some((number) => !there.has(number))
}

function tokens(name: string): string[] {
  return normalizeName(name)
    .split('-')
    .filter((token) => token.length > 2)
    .map(stem)
}

/**
 * The town's name is not part of the race's name.
 *
 * The pair has already agreed on the city, so a word that is the city adds
 * nothing, and it moves around: "28. Erfurter Zooparklauf" is "Zooparklauf
 * Erfurt", "Hochheimer Weinbergslauf" is "22. Weinbergslauf Hochheim". German
 * attaches the town as an adjective, hence the few letters of slack.
 */
function withoutPlace(name: string, city: string): string[] {
  const place = tokens(city)
  const isPlace = (token: string) =>
    place.some(
      (word) => token === word || (token.startsWith(word) && token.length - word.length <= 3),
    )
  return tokens(name).filter((token) => !isPlace(token))
}

/**
 * One name inside the other, once the noise and the town are gone.
 *
 * Or the same letters in the same order, which is what separates a race from
 * itself written differently: "Sparkassen-City-Lauf" and "Sparkassen Citylauf",
 * "CityRUN" and "City RUN", "PhoenixInWest" and "Phoenix-InWest". Equality and
 * not containment, because "Stundenlauf" inside "Viertelstundenlauf" is a
 * different race.
 */
function namesAgree(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const a = withoutPlace(left.name, left.city)
  const b = withoutPlace(right.name, right.city)
  if (a.length === 0 || b.length === 0) return false

  if (a.join('') === b.join('')) return true

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every((token) => longer.includes(token))
}

function daysOf(entry: RaceCatalogEntry): string[] {
  const days = (entry.editions ?? [])
    .map((edition) => edition.raceDate)
    .filter((day): day is string => Boolean(day))
  return [...new Set(days)]
}

function sameDay(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const leftDays = new Set(daysOf(left))
  if (leftDays.size === 0) return false
  return daysOf(right).some((day) => leftDays.has(day))
}

/**
 * How far apart two sources may date one event.
 *
 * An event that runs over a weekend has no single day, and each source picks
 * one: the Gerês Extreme Marathon runs from the 27th to the 29th of November
 * with its distances spread across the three, and one calendar dates it the
 * 27th while the other dates the 42 km the 29th. The Maratona da Europa is the
 * 24th to one source and the 25th to the other.
 *
 * Two days, and only where the names agree. A week apart is a different edition
 * of a series, and where the name is not the evidence the day stays exact: see
 * `findCatalogDuplicate`.
 */
const SPREAD_DAYS = 2

function daysAgree(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const here = daysOf(left)
  const there = daysOf(right)
  if (here.length === 0 || there.length === 0) return false

  const day = (value: string) => Date.parse(`${value}T00:00:00Z`)
  return here.some((one) =>
    there.some((other) => {
      const apart = Math.abs(day(one) - day(other))
      return Number.isFinite(apart) && apart <= SPREAD_DAYS * 86400000
    }),
  )
}

/**
 * Words that qualify a town rather than name one.
 *
 * German writes the same town a dozen ways and each source picks one: "Freiburg
 * im Breisgau", "Neuenstadt am Kocher", "Hermsdorf/Thueringen". What is left
 * after these is the name.
 */
const PLACE_NOISE = /\b(?:im|am|an|auf|der|den|dem|des|die|das|ob|vor|in|bad)\b/giu

/**
 * A town named by what it is near is not that town.
 *
 * "Rüdersdorf bei Berlin" is a town twenty kilometres outside Berlin, and
 * dropping "bei" as a qualifier left the tokens Rüdersdorf and Berlin, so
 * "Berlin" was a subset of it and the two places agreed. What follows the word
 * is the landmark; the town is what comes before it.
 */
const NEAR = /\s(?:bei|beim|near|nr\.?|próximo\s+de|proximo\s+de|cerca\s+de|pres\s+de)\s/iu

/**
 * A town's name as tokens, with everything that only qualifies it removed.
 *
 * A parenthetical is a qualifier too ("Dabendorf (Zossen)", "Bernburg
 * (Saale)"), and so is an abbreviation a source could not be bothered to
 * expand ("Neuenstadt A.k."), which is why anything under three letters goes.
 */
function placeTokens(city: string): string[] {
  const town = city.split(NEAR)[0] ?? city
  return slugify(town.replace(/\(.*?\)/g, ' ').replace(PLACE_NOISE, ' '))
    .split('-')
    .filter((token) => token.length >= 3)
}

/**
 * The same town, however much of its name a source wrote.
 *
 * Equality was too strict, and every pair a person checked by hand says so:
 * "Dabendorf" and "Dabendorf (Zossen)", "Freiburg" and "Freiburg im Breisgau",
 * "Dessau" and "Dessau-Rosslau", "Goslar-Hahnenklee" and "Hahnenklee". One name
 * inside the other is the same place named at two levels of detail, which is
 * what a district, a merged municipality and a disambiguator all look like.
 *
 * It does let "Frankfurt" match "Frankfurt (Oder)", which are two cities. What
 * keeps that from becoming a merge is everything else the pair still has to
 * agree on: the same day, and a name that agrees or a word worth asking about.
 */
/**
 * The same town with one letter more, which is how languages spell it.
 *
 * "Night Marathon Luxembourg" in Luxembourg and "ING Night Marathon
 * Luxembourg" in Luxemburg are one race, and a German calendar spelling a
 * foreign city its own way is the normal case here.
 *
 * A letter added or removed only, never one swapped, and never under seven of
 * them. That is the difference between Luxembourg and Luxemburg on one hand and
 * Freiburg and Freiberg on the other, which are two cities four hundred
 * kilometres apart.
 */
function oneLetterApart(here: string, there: string): boolean {
  const [shorter, longer] = here.length <= there.length ? [here, there] : [there, here]
  if (shorter.length < 7 || longer.length !== shorter.length + 1) return false

  let at = 0
  for (let index = 0; index < longer.length; index += 1) {
    if (shorter[at] === longer[index]) at += 1
  }
  return at === shorter.length
}

function sameTown(here: string, there: string): boolean {
  return here === there || oneLetterApart(here, there)
}

function samePlace(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  if (left.country.toUpperCase() !== right.country.toUpperCase()) return false

  const here = placeTokens(left.city)
  const there = placeTokens(right.city)
  if (here.length === 0 || there.length === 0) return false

  const [shorter, longer] = here.length <= there.length ? [here, there] : [there, here]
  return shorter.every((token) => longer.some((other) => sameTown(token, other)))
}

function reviewed(entry: RaceCatalogEntry): boolean {
  return entry.review === 'reviewed' || entry.producer === 'curated'
}

/** An operator said these two are different races, so no rule may relink them. */
function keptApart(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  return Boolean(
    left.notDuplicateOf?.includes(right.id) || right.notDuplicateOf?.includes(left.id),
  )
}

/**
 * Whether this pair has already been answered, either way.
 *
 * The queue an operator works through is a document the daily pass writes, so
 * it is up to a day old, and it kept asking about pairs that had just been
 * answered: pressing "different races" wrote the answer and the row stayed on
 * screen, which reads as a button that does nothing. Merged counts too, and in
 * either direction, since the operator picks which name survives.
 */
export function pairAlreadyAnswered(
  left: RaceCatalogEntry,
  right: RaceCatalogEntry,
): boolean {
  return Boolean(
    left.retired ||
      right.retired ||
      left.duplicateOfCatalogRaceId ||
      right.duplicateOfCatalogRaceId ||
      keptApart(left, right),
  )
}

/**
 * The distances do not rule the pair out.
 *
 * An overlap where both sides publish one, and a free pass where either side
 * publishes none: not knowing a distance is not the same as knowing a different
 * one, and half the sources leave it out. "Birkenfelder Firmenlauf" with no
 * distance and "Birkenfelder Firmenlauf - Die Wirtschaft läuft" over 5 km sat
 * side by side in the catalog for exactly this reason.
 *
 * Only the reviewed anchor asks for this now. When the names plainly agree it
 * is dropped, because two sources reading one event publish different subsets
 * of what it sells and the subsets can be disjoint: one has the "wep Marathon"
 * and the other the "wep-Strom Lauf" over 5, 10 and 21 km. Where the only
 * evidence is that a person checked one side, the distance is what keeps a
 * charity 5 km out of the New York marathon it happens to share a Sunday with.
 */
function distancesAgree(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  if (left.disciplines.length === 0 || right.disciplines.length === 0) return true
  const mine = new Set(left.disciplines)
  return right.disciplines.some((discipline) => mine.has(discipline))
}

/**
 * As far as the day and the place can tell, one race.
 *
 * Necessary and nowhere near sufficient: the Berlin weekend has two different
 * 5 km in the same city on the same day. What the two callers do with it is
 * where they differ, one asserts and the other asks.
 */
function couldBeTheSameRace(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  return (
    left.id !== right.id &&
    left.retired !== true &&
    right.retired !== true &&
    !left.duplicateOfCatalogRaceId &&
    !right.duplicateOfCatalogRaceId &&
    !keptApart(left, right) &&
    daysAgree(left, right) &&
    // Two sources dating one event differently is the weakest ground there is,
    // so it asks for the distances back: the Berlin marathon weekend puts a
    // 5 km on the Saturday and the marathon on the Sunday, and the two names
    // come down to "marathon" either way.
    (sameDay(left, right) || distancesAgree(left, right)) &&
    !numbersRuleOut(left, right) &&
    samePlace(left, right)
  )
}

/**
 * How far an annual race may drift and still be the same race.
 *
 * The Copenhagen Half Marathon is the 19th of September in 2026 and the 17th in
 * 2027, and a race pinned to the third Sunday moves by up to six days a year.
 * Three weeks is generous enough for that and short enough to keep a spring
 * race away from an autumn one with the same name.
 */
const DRIFT_DAYS = 21

/** The day within the year, so two dates in different years can be compared. */
function dayOfYear(day: string): number | null {
  const at = Date.parse(`${day}T00:00:00Z`)
  if (!Number.isFinite(at)) return null
  const date = new Date(at)
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.round((at - start) / 86400000)
}

/**
 * The same time of year, whatever the year.
 *
 * Falls back to the month a race usually falls in, because an entry whose
 * editions carry no day at all still says that much.
 */
function sameTimeOfYear(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const here = daysOf(left).map(dayOfYear).filter((day): day is number => day !== null)
  const there = daysOf(right).map(dayOfYear).filter((day): day is number => day !== null)

  if (here.length > 0 && there.length > 0) {
    return here.some((one) =>
      there.some((other) => {
        const apart = Math.abs(one - other)
        // Around the turn of the year, the 31st of December and the 2nd of
        // January are two days apart and not three hundred and sixty three.
        return Math.min(apart, 365 - apart) <= DRIFT_DAYS
      }),
    )
  }

  const month = left.typicalRaceMonth
  return Boolean(month && month === right.typicalRaceMonth)
}

/**
 * One race, written down twice for two different years.
 *
 * An entry is a race and its editions are the years, so two entries for the
 * same race are duplicates however far apart their days are. The rest of this
 * file compares days because it was built for the harvest, where two sources
 * describe the same edition still ahead. That leaves the case this covers:
 * "Copenhagen Half Marathon" for the 19th of September 2026 and "Copenhagen
 * Half Marathon" for the 17th of September 2027, which no day-based rule can
 * ever bring together, and a runner proposing the edition they ran in 2026
 * against a catalog that only lists 2027.
 *
 * The day being useless here is why everything else has to hold: the names
 * agree once the sponsors, the edition and the town are gone, the place agrees,
 * no number contradicts, and it is the same time of year.
 *
 * What this cannot bridge is a town written in two languages. "Berlim" and
 * "Berlin" are one place and `sameTown` reads them as two, so a proposal from a
 * Portuguese phone still lands beside the German listings.
 */
export function sameAnnualRace(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  return (
    left.id !== right.id &&
    left.retired !== true &&
    right.retired !== true &&
    !left.duplicateOfCatalogRaceId &&
    !right.duplicateOfCatalogRaceId &&
    !keptApart(left, right) &&
    samePlace(left, right) &&
    !numbersRuleOut(left, right) &&
    namesAgree(left, right) &&
    sameTimeOfYear(left, right)
  )
}

/**
 * The entry a harvested race belongs to, or nothing.
 *
 * Nothing is the safe answer and the common one: two races nobody has checked,
 * on the same day, at the same distance, in the same city, stay two races.
 */
export function findCatalogDuplicate(
  harvested: RaceCatalogEntry,
  catalog: readonly RaceCatalogEntry[],
): RaceCatalogEntry | null {
  for (const entry of catalog) {
    if (!couldBeTheSameRace(entry, harvested)) continue
    if (namesAgree(entry, harvested)) return entry
  }

  return null
}

/**
 * Words that every race is called, so sharing one is not evidence.
 *
 * Only the queue uses this. The merge rule must not: "Haspa Halbmarathon" and
 * "Haspa Marathon" would both come down to "haspa" and merge into one race,
 * and they are two.
 */
/**
 * Exported because a name search needs the same judgement: the word worth
 * asking the server for is the one that is not on every second race.
 */
export const GENERIC =
  /^(?:run|running|race|races|walk|walking|lauf|laufen|laufe|marathon|halbmarathon|half|halb|halv|semi|maraton|maratona|maratonina|marathons|meia|mezza|media|corrida|carrera|course|cursa|prova|mile|miles|meile|meilen|fun|annual|kids|family|charity|memorial|benefit|benefiz|trail|dash|trot|jog|festival|challenge|classic|city|cup|series|night|day|virtual|sport|sports|team|teams|open|volkslauf|stadtlauf|firmenlauf|\d{1,3}k|\d{1,2}km)$/i

/**
 * The names share a word that means something.
 *
 * What the queue needs and the merge rule does not: a reason to suspect the
 * pair beyond a shared town and a shared Saturday. With a hundred entries the
 * day and the distance were rare enough to be evidence; with thousands, one
 * September Saturday in Berlin holds a dozen unrelated races, and the queue
 * filled with pairs like "Bierpaarlauf" against "Gravel Run Berlin".
 *
 * The town's own name does not count as that word: half the races in Berlin
 * carry "Berlin", and pairing them all is the flood this exists to stop.
 */
/**
 * Under four letters, a shared word is not evidence.
 *
 * "Turkey Trails OKC" and "Veterans Voyage OKC" share the town's own
 * abbreviation, and chasing abbreviations is a list with no end. Every word
 * that turned out to be real evidence was longer: rathaus, phoenix, sparkassen,
 * zooparklauf.
 */
const EVIDENCE_MIN_LETTERS = 4

function sharesAWord(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const place = new Set([...tokens(left.city), ...tokens(right.city)])
  const meaningful = (token: string) =>
    token.length >= EVIDENCE_MIN_LETTERS && !place.has(token) && !GENERIC.test(token)
  const mine = new Set(tokens(left.name).filter(meaningful))
  return tokens(right.name).some((token) => meaningful(token) && mine.has(token))
}

/**
 * How much of an entry somebody stands behind.
 *
 * Decides which of a pair is offered as the survivor, and nothing else: a merge
 * still needs a person to press the button. Reviewed beats unreviewed, and among
 * unreviewed entries the one carrying a fee or a deadline is the one worth
 * keeping, because those are the fields a runner actually came for.
 */
function worth(entry: RaceCatalogEntry): number {
  const editions = entry.editions ?? []
  const hasGates = editions.some(
    (edition) => edition.typicalFee !== undefined || edition.registrationClosesAt !== undefined,
  )
  return (reviewed(entry) ? 8 : 0) + (hasGates ? 4 : 0) + Math.min(editions.length, 3)
}

/**
 * The pair with the entry worth keeping first.
 *
 * Exported because two callers have to agree on it: the queue, which suggests
 * a survivor to the operator, and the backfill that applies a changed rule to
 * what is already stored. A tie goes to the lower id, so the answer does not
 * depend on which order the pair was read in.
 */
export function survivorFirst(
  left: RaceCatalogEntry,
  right: RaceCatalogEntry,
): [RaceCatalogEntry, RaceCatalogEntry] {
  if (worth(left) === worth(right)) {
    return left.id < right.id ? [left, right] : [right, left]
  }
  return worth(left) > worth(right) ? [left, right] : [right, left]
}

export type DuplicateCandidate = {
  /** The entry offered as the survivor. */
  keep: RaceCatalogEntry
  /** The entry that would be pointed at it. */
  drop: RaceCatalogEntry
}

/**
 * Pairs that look like one race and that no rule will merge on its own.
 *
 * The automatic rule only acts when a person's entry is one half of the pair or
 * the names plainly agree, which leaves the case two sources produce: the same
 * race, two organiser names that do not agree, and nobody having checked
 * either. That is a judgement, so it becomes a queue instead of a guess.
 *
 * The Berlin weekend's two 5 km show up here, and should: a person answering
 * "different races" is the only thing that can tell them apart, and the answer
 * is recorded so the pair does not come back every week.
 */
export function catalogDuplicateCandidates(
  catalog: readonly RaceCatalogEntry[],
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = []

  for (let index = 0; index < catalog.length; index += 1) {
    for (let other = index + 1; other < catalog.length; other += 1) {
      const left = catalog[index]
      const right = catalog[other]
      // Two entries for one race in two different years belong here too. No
      // day-based rule can see them, and nothing merges them on its own: what
      // a person answers is which of the two the editions should live on.
      const acrossYears = sameAnnualRace(left, right)
      if (!acrossYears && !couldBeTheSameRace(left, right)) continue
      // Whatever the rule would have merged is already merged, so anything left
      // needing a decision is by definition what it declined.
      if (findCatalogDuplicate(right, [left])) continue
      // And a pair with no word in common is not a question, it is two races.
      if (!acrossYears && !sharesAWord(left, right)) continue

      const [keep, drop] = survivorFirst(left, right)
      candidates.push({ keep, drop })
    }
  }

  return candidates
}
