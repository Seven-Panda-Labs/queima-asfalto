import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
import { DayField } from '../../components/DatePicker'
import { NearbyParkruns } from '../../components/NearbyParkruns'
import { FilterBar, FilterGroup, FilterPill } from '../../components/FilterBar'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useBucketList } from '../../hooks/useBucketList'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { useEvents } from '../../hooks/useEvents'
import { useRaceEntries } from '../../hooks/useRaceEntries'
import { useRaces } from '../../hooks/useRaces'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { visibleDisciplines } from '../../domain/disciplinePreferences'
import {
  EMPTY_CRITERIA,
  findCandidates,
  type DiscoveryCandidate,
  type DiscoveryCriteria,
} from '../../domain/raceDiscovery'
import type { SeasonRace } from '../../domain/seasonRules'
import { tuneUpWindowFor } from '../../domain/seasonRules'
import { isAnchorFor } from '../../domain/seasonAnchors'
import {
  centreFromEntries,
  RADIUS_OPTIONS,
  withinRadius,
  type Centre,
} from '../../domain/raceRadius'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { canAssertDates, duplicateVotePairId, searchTokens } from '../../../shared/raceCatalog'
import { catalogDuplicateCandidates } from '../../../shared/eventDiscovery/duplicates'
import { loadMyAnsweredPairs, recordDuplicateVote } from '../../services/duplicateVotes'
import { DuplicateHint } from './DuplicateHint'
import {
  catalogRaceToBucketListItem,
  findOrCreateCatalogRaceId,
  loadHarvestStatus,
  searchRaceCatalog,
} from '../../services/raceCatalog'
import { setRaceSeasonRole } from '../../services/races'
import { formatDatePt } from '../../utils/date'
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  HeartIcon,
} from '../../components/icons/actionIcons'
import { NOMINAL_DISTANCE_KM } from '../../domain/eventCodes'
import { prefillFromCatalog } from '../../domain/entryPrefill'
import { ScheduleRaceDialog } from '../../components/ScheduleRaceDialog/ScheduleRaceDialog'
import type { EventType } from '../../types/Event'
import type { ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import { useUserResultsProfile } from '../../hooks/useUserResultsProfile'


const FIELD = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm'

/** Every parkrun, everywhere, forever. */
const PARKRUN_DISTANCE_KM = 5

/**
 * Rows per search, and how many more each time somebody asks.
 *
 * The catalog is thousands of races across dozens of countries, so a page that
 * lists it is a page nobody reads. Twenty is a screen.
 */
const PAGE_SIZE = 20

/**
 * How many rows a radius search asks for per row it shows.
 *
 * The circle is applied after the query, because Firestore cannot answer "within
 * 40 km" without a geohash, so the query has to bring enough candidates for the
 * circle to have something to keep. Ten is a country's worth of a given month
 * for the countries that carry coordinates.
 */
const RADIUS_OVERFETCH = 10

/**
 * A search needs something to narrow it beyond the date.
 *
 * Without this the page opens on "every race in the world, soonest first",
 * which is the list that made this change necessary. A country, a distance, a
 * place or an anchor is enough.
 */
function hasFilter(
  criteria: DiscoveryCriteria,
  anchorRaceId: string,
  hasCircle: boolean,
): boolean {
  return Boolean(
    criteria.country ||
      criteria.place.trim() ||
      criteria.disciplines.length > 0 ||
      anchorRaceId ||
      // "Races within 50 km of me" is a filter, and the most natural question
      // on the page. A radius with nothing to measure from is not.
      hasCircle,
  )
}

/** Kilometres, or nothing, from the select's string value. */
function readRadius(value: string): number | null {
  const km = Number(value)
  return Number.isFinite(km) && km > 0 ? km : null
}

/** The country's own name in the reader's language, with the code as a fallback. */
function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/**
 * The countries in the order a reader can follow: by the name on screen.
 *
 * The stored list is sorted by ISO code, which is the key nobody sees. In
 * Portuguese that reads Andorra, Emirados Árabes Unidos, Albânia, Armênia,
 * Antártida, Argentina, and looks like no order at all. The collator is what
 * puts Áustria under A and Suíça under S.
 */
function byName(codes: readonly string[], language: string): string[] {
  const collator = new Intl.Collator(language, { sensitivity: 'base' })
  return [...codes].sort((left, right) =>
    collator.compare(countryName(left, language), countryName(right, language)),
  )
}

/** `YYYY-MM-DD`, which is what a native date input wants. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function Candidate({
  candidate,
  marked,
  busy,
  onMark,
  onUnmark,
  onSchedule,
}: {
  candidate: DiscoveryCandidate
  /** Already on this runner's list of races they want. */
  marked: boolean
  busy: boolean
  onMark: () => void
  onUnmark: () => void
  onSchedule: () => void
}) {
  const { t } = useTranslation()
  const { entry, edition, date, fitsAnchor, weeksBeforeAnchor } = candidate
  const fee =
    edition.typicalFee !== undefined
      ? `${edition.typicalFee} ${edition.feeCurrency ?? ''}`.trim()
      : null

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-3 last:border-b-0">
      <span className="font-semibold text-foreground">{entry.name}</span>
      {fitsAnchor ? (
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
          {t('findRaces.fitsAnchor', { count: Math.round(weeksBeforeAnchor ?? 0) })}
        </span>
      ) : null}
      <span className="text-xs text-muted">{formatDatePt(date)}</span>
      <span className="text-xs text-muted">
        {[entry.city, entry.country].filter(Boolean).join(', ')}
      </span>
      <span className="text-xs text-muted">
        {entry.disciplines.length > 0
          ? entry.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')
          : t('findRaces.distanceUnknown')}
      </span>
      {fee ? <span className="text-xs text-muted">{fee}</span> : null}
      {/* An unreviewed entry may prefill a field and may never assert a deadline,
          so the closing date is shown as what the listing said, not as a promise. */}
      {edition.registrationClosesAt ? (
        <span className="text-xs text-muted">
          {t(
            canAssertDates(entry)
              ? 'findRaces.closes'
              : 'findRaces.closesUnreviewed',
            { date: formatDatePt(new Date(edition.registrationClosesAt)) },
          )}
        </span>
      ) : null}

      <div className="ms-auto flex items-center gap-2">
        {entry.officialUrl ? (
          <a
            href={entry.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t('findRaces.openSource')}
            aria-label={t('findRaces.openSource')}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
          >
            <ExternalLinkIcon />
          </a>
        ) : null}
        {/* The answer to a gap in a season is a race in the calendar, so this
            is here: marking one and stopping was a dead end. */}
        <button
          type="button"
          onClick={onSchedule}
          disabled={busy}
          aria-label={t('findRaces.schedule', { name: entry.name })}
          title={t('findRaces.schedule', { name: entry.name })}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
        >
          <CalendarPlusIcon />
        </button>
        <button
          type="button"
          onClick={marked ? onUnmark : onMark}
          disabled={busy}
          aria-label={t(marked ? 'findRaces.unmark' : 'findRaces.add', { name: entry.name })}
          title={t(marked ? 'findRaces.unmark' : 'findRaces.add', { name: entry.name })}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
        >
          {/* A wish is a heart on a race in the catalog, and pressing it again
              takes it back. Filled says which of the two it is. */}
          <HeartIcon filled={marked} />
        </button>
      </div>
    </li>
  )
}

/**
 * Races the runner does not know about yet.
 *
 * The catalog is queried, not read: it holds thousands of races across dozens
 * of countries, and pulling it into the browser to filter there was five
 * thousand document reads for twenty rows. So the page asks for nothing until
 * it has something to narrow by, and asks the server for a page at a time.
 *
 * What it owes in return is honesty about how current the catalog is, which is
 * the line at the bottom.
 */
export function FindRaces() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { items, addItem, removeItem } = useBucketList()
  const { entries: raceEntries } = useRaceEntries()
  const { races } = useRaces()
  const { profile: resultsProfile } = useUserResultsProfile()
  const { allEvents, addEvent } = useEvents()

  /**
   * The runner's own parkruns: the ones they starred, plus the ones they have
   * run. Evidence, rather than asking the browser where they are.
   */
  const knownParkrunSlugs = useMemo(() => {
    const slugs = new Set(resultsProfile.favoriteParkrunSlugs ?? [])
    for (const event of allEvents) {
      if (event.parkrunEventSlug) slugs.add(event.parkrunEventSlug)
    }
    return [...slugs]
  }, [allEvents, resultsProfile.favoriteParkrunSlugs])

  /** Planning is moving it onto the calendar, which for a parkrun is Saturday. */
  async function planParkrun(parkrun: ParkrunCatalogEvent, date: Date) {
    if (!user) return
    try {
      await addEvent({
        name: parkrun.longName,
        date,
        realDistance: PARKRUN_DISTANCE_KM,
        eventType: 'km_5',
        location: parkrun.location,
        status: 'planned',
        resultsPlatform: 'parkrun',
        parkrunEventSlug: parkrun.slug,
        parkrunCountryUrl: parkrun.countryUrl,
      })
      toast.success(t('parkrunDiscovery.planned', { name: parkrun.longName }))
    } catch {
      toast.error(t('parkrunDiscovery.planError'))
    }
  }

  /** A parkrun to keep an eye on: the one you would travel for. */
  async function watchParkrun(parkrun: ParkrunCatalogEvent) {
    if (!user) return
    try {
      await addItem({
        name: parkrun.longName,
        location: parkrun.location,
        realDistance: PARKRUN_DISTANCE_KM,
        disciplines: ['km_5'],
        // The catalog's country url carries its own scheme.
        link: `${parkrun.countryUrl.replace(/\/$/, '')}/${parkrun.slug}/`,
      })
      setWatchedParkruns((current) => [...current, parkrun.slug])
      toast.success(t('findRaces.addedToast', { name: parkrun.longName }))
    } catch {
      toast.error(t('findRaces.addError'))
    }
  }
  const { enabledDisciplines } = useDisciplines()

  const [catalog, setCatalog] = useState<RaceCatalogEntry[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [countries, setCountries] = useState<string[]>([])
  const [radiusKm, setRadiusKm] = useState<number | null>(null)
  /** The browser's answer, when the runner asked it. */
  const [located, setLocated] = useState<Centre | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationRefused, setLocationRefused] = useState(false)
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)
  /**
   * The dates the caller asked about, when it was a gap in the season.
   *
   * Read once. What the runner types afterwards is theirs, and a link that
   * kept overwriting it would make the filters unusable.
   */
  const [searchParams] = useSearchParams()
  /** The season the visit came from, so going back lands on it again. */
  const backToPlanning = searchParams.get('season')
    ? `/planeamento?year=${searchParams.get('season')}`
    : '/planeamento'
  const [criteria, setCriteria] = useState<DiscoveryCriteria>(() => ({
    ...EMPTY_CRITERIA,
    from: searchParams.get('from') ?? EMPTY_CRITERIA.from,
    to: searchParams.get('to') ?? EMPTY_CRITERIA.to,
  }))
  const [anchorRaceId, setAnchorRaceId] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  /** The race whose date is being picked, on its way to the calendar. */
  const [entryToSchedule, setEntryToSchedule] = useState<RaceCatalogEntry | null>(null)
  const [scheduling, setScheduling] = useState(false)
  const [watchedParkruns, setWatchedParkruns] = useState<string[]>([])
  /** Pairs this runner has already answered, so the question is asked once. */
  const [answeredPairs, setAnsweredPairs] = useState<Set<string>>(new Set())

  useEffect(() => {
    void loadHarvestStatus().then((status) => {
      setSyncedAt(status.syncedAt)
      setCountries(status.countries)
    })
  }, [])

  // The uid and not the user: a context handing back a fresh object on every
  // render would reload this on every render, and an answer just given would
  // be overwritten by the read that started before it.
  const uid = user?.uid
  useEffect(() => {
    if (!uid) return
    void loadMyAnsweredPairs(uid).then(setAnsweredPairs)
  }, [uid])

  /**
   * The anchors a window can come from: still ahead, and with a date.
   *
   * Read off the race rather than the wish, so an anchor that was scheduled, or
   * that never was a wish at all, is offered here too.
   */
  const anchors = useMemo(() => {
    const now = Date.now()
    const candidates: { itemId?: string; race: SeasonRace }[] = []

    for (const race of races) {
      const item = items.find((candidate) => candidate.raceId === race.id)
      const dates = [
        ...raceEntries.filter((entry) => entry.raceId === race.id).map((entry) => entry.raceDate),
        ...allEvents.filter((event) => event.raceId === race.id).map((event) => event.date),
      ].filter((date): date is Date => date instanceof Date)

      const date = dates
        .filter((candidate) => candidate.getTime() >= now)
        .sort((left, right) => left.getTime() - right.getTime())[0]
      if (!date || !isAnchorFor(race, date.getFullYear())) continue

      const distanceKm =
        item?.realDistance ??
        allEvents.find((event) => event.raceId === race.id)?.realDistance ??
        0
      if (distanceKm <= 0) continue

      candidates.push({
        itemId: item?.id,
        race: { id: race.id, name: race.name, date, distanceKm, isAnchor: true },
      })
    }

    return candidates.sort(
      (left, right) => left.race.date.getTime() - right.race.date.getTime(),
    )
  }, [allEvents, items, raceEntries, races])

  const anchor = anchors.find((candidate) => candidate.race.id === anchorRaceId)?.race

  /** Picking an anchor fills the window in, which is the query the interviews describe. */
  function pickAnchor(raceId: string) {
    setAnchorRaceId(raceId)
    const picked = anchors.find((candidate) => candidate.race.id === raceId)?.race
    if (!picked) return
    const window = tuneUpWindowFor(picked)
    setCriteria((current) => ({
      ...current,
      from: isoDay(window.from),
      to: isoDay(window.to),
    }))
  }

  /**
   * Where to measure from: what the browser said, else the town typed.
   *
   * No geocoder: a race in that town carries the town's coordinates, so the
   * catalog is the gazetteer. A place nothing matches has no centre, and the
   * page says so rather than pretending the circle applied.
   */
  const placeCentre = useMemo(
    () => centreFromEntries(catalog ?? [], criteria.place),
    [catalog, criteria.place],
  )
  /**
   * As two numbers, so nothing downstream depends on an object's identity.
   *
   * The centre is derived from the results, so a fresh object on every answer
   * would re-run the query that produced it. Numbers cannot.
   */
  const centreLat = located?.lat ?? placeCentre?.lat
  const centreLng = located?.lng ?? placeCentre?.lng
  const hasCentre = centreLat !== undefined && centreLng !== undefined

  function askForLocation() {
    if (!navigator.geolocation) {
      setLocationRefused(true)
      return
    }
    setLocating(true)
    setLocationRefused(false)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocated({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocating(false)
      },
      () => {
        // Refusing is an answer, and the place box still works.
        setLocationRefused(true)
        setLocating(false)
      },
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  /**
   * One query per search, filtered by the server.
   *
   * What the runner types now reaches it. It used to be a filter over the page
   * that had already been fetched, which made a race findable by name only if
   * it happened to be among the next twenty worldwide: the whole word goes to
   * the server as a `nameTokens` match, and the rest of what was typed still
   * narrows what comes back.
   */
  const filtered = hasFilter(criteria, anchorRaceId, Boolean(radiusKm && hasCentre))
  // Memoised so the array keeps its identity: the query effect depends on it,
  // and a fresh array of the same words would re-run the search on every
  // render.
  const nameTokens = useMemo(() => searchTokens(criteria.place), [criteria.place])
  useEffect(() => {
    if (!filtered) {
      setCatalog(null)
      return
    }

    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      void searchRaceCatalog({
        country: criteria.country || undefined,
        // One array-contains per query is all Firestore allows, so the rest of
        // the picked disciplines narrow what came back.
        discipline: criteria.disciplines[0],
        nameTokens,
        from: criteria.from || undefined,
        to: criteria.to || undefined,
        limit: radiusKm && hasCentre ? pageSize * RADIUS_OVERFETCH : pageSize,
      })
        .then((races) => {
          if (!cancelled) setCatalog(races)
        })
        .catch(() => {
          if (!cancelled) setCatalog([])
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    centreLat,
    centreLng,
    hasCentre,
    criteria.country,
    criteria.disciplines,
    criteria.from,
    criteria.to,
    filtered,
    nameTokens,
    pageSize,
    radiusKm,
  ])

  /**
   * The circle, applied to what the query brought back.
   *
   * After the query and before the ranking: the entries with no coordinates are
   * counted rather than dropped quietly, because a race the source did not
   * place may be the one next door.
   */
  const circled = useMemo(() => {
    if (!catalog || !radiusKm || centreLat === undefined || centreLng === undefined) {
      return { entries: catalog ?? [], unplaced: 0 }
    }
    return withinRadius(catalog, { lat: centreLat, lng: centreLng }, radiusKm)
  }, [catalog, centreLat, centreLng, radiusKm])

  const candidates = useMemo(
    () => findCandidates(circled.entries, criteria, { anchor }),
    [anchor, circled.entries, criteria],
  )

  /**
   * The pairs on screen that look like one race, keyed by the lower row.
   *
   * Computed over the rows shown and not over the catalog: a runner can only
   * answer about what is in front of them, and because the list is ordered by
   * date, the two entries of one race land next to each other. Once answered
   * the pair drops out, so the question is asked once.
   */
  const duplicatePairs = useMemo(() => {
    const shown = candidates.map((candidate) => candidate.entry)
    const byLowerRow = new Map<string, [RaceCatalogEntry, RaceCatalogEntry]>()
    for (const pair of catalogDuplicateCandidates(shown)) {
      if (answeredPairs.has(duplicateVotePairId(pair.keep.id, pair.drop.id))) continue
      const at = Math.max(
        shown.findIndex((entry) => entry.id === pair.keep.id),
        shown.findIndex((entry) => entry.id === pair.drop.id),
      )
      byLowerRow.set(shown[at]!.id, [pair.keep, pair.drop])
    }
    return byLowerRow
  }, [answeredPairs, candidates])

  const sortedCountries = useMemo(
    () => byName(countries, i18n.language),
    [countries, i18n.language],
  )

  const disciplineOptions = useMemo(
    () => visibleDisciplines(enabledDisciplines, criteria.disciplines),
    [criteria.disciplines, enabledDisciplines],
  )

  /**
   * A runner's answer about a pair, which is a vote and not a decision.
   *
   * It merges nothing: the merge points one catalog id at another and a
   * runner's own race may already reference either. What it does is move the
   * pair up the queue an operator works through.
   */
  async function answerDuplicate(
    left: RaceCatalogEntry,
    right: RaceCatalogEntry,
    same: boolean,
  ) {
    if (!user) return
    try {
      await recordDuplicateVote(user.uid, left.id, right.id, same)
      setAnsweredPairs((current) =>
        new Set(current).add(duplicateVotePairId(left.id, right.id)),
      )
      toast.success(t('findRaces.duplicateThanks'))
    } catch {
      toast.error(t('findRaces.duplicateError'))
    }
  }

  /**
   * The races this runner has already marked, by catalog id.
   *
   * Read from the wishes rather than remembered for this visit: a race marked
   * last week arrived unmarked, and marking it again was the only thing the
   * page let you do with it.
   */
  const markedCatalogIds = useMemo(() => {
    const catalogByRaceId = new Map(
      races.filter((race) => race.catalogRaceId).map((race) => [race.id, race.catalogRaceId!]),
    )
    const marked = new Set<string>()
    for (const item of items) {
      const catalogRaceId = item.raceId ? catalogByRaceId.get(item.raceId) : undefined
      if (catalogRaceId) marked.add(catalogRaceId)
    }
    return marked
  }, [items, races])

  /** The wish for a catalog race, when this runner has one. */
  function wishFor(entry: RaceCatalogEntry) {
    const raceIds = new Set(
      races.filter((race) => race.catalogRaceId === entry.id).map((race) => race.id),
    )
    return items.find((item) => item.raceId && raceIds.has(item.raceId)) ?? null
  }

  async function handleMark(entry: RaceCatalogEntry) {
    if (!user) return
    setAdding(entry.id)
    try {
      const raceId = await findOrCreateCatalogRaceId(user.uid, entry)
      if (!raceId) return
      await addItem(catalogRaceToBucketListItem(raceId))
      // Searching for an anchor is the runner saying what this race is for,
      // and that is a fact about a season, so it lives on the race.
      if (anchor?.id) await setRaceSeasonRole(raceId, { servesRaceId: anchor.id })
      toast.success(t('findRaces.addedToast', { name: entry.name }))
    } catch {
      toast.error(t('findRaces.addError'))
    } finally {
      setAdding(null)
    }
  }

  async function handleUnmark(entry: RaceCatalogEntry) {
    const wish = wishFor(entry)
    if (!wish) return
    setAdding(entry.id)
    try {
      await removeItem(wish.id)
      toast.success(t('findRaces.unmarkedToast', { name: entry.name }))
    } catch {
      toast.error(t('findRaces.addError'))
    } finally {
      setAdding(null)
    }
  }

  /**
   * Straight into the calendar, without going through a wish.
   *
   * Arriving here from a gap in a season and being able only to mark the race
   * as a dream was a dead end: the gap is a date that wants filling.
   */
  async function handleSchedule(eventType: EventType, day: string) {
    const entry = entryToSchedule
    if (!entry || !user) return
    setScheduling(true)
    try {
      const raceId = await findOrCreateCatalogRaceId(user.uid, entry)
      await addEvent({
        name: entry.name,
        date: new Date(`${day}T12:00:00`),
        realDistance: NOMINAL_DISTANCE_KM[eventType],
        eventType,
        location: [entry.city, entry.country].filter(Boolean).join(', '),
        locationLat: entry.latitude,
        locationLng: entry.longitude,
        status: 'planned',
        ...(raceId ? { raceId } : {}),
      })
      // It is in the calendar now, so it is not a race somebody wants one day.
      const wish = wishFor(entry)
      if (wish) await removeItem(wish.id)
      setEntryToSchedule(null)
      toast.success(t('findRaces.scheduledToast', { name: entry.name }))
    } catch {
      toast.error(t('findRaces.addError'))
    } finally {
      setScheduling(false)
    }
  }

  /** Any change to the criteria starts the list from the top again. */
  useEffect(() => {
    setPageSize(PAGE_SIZE)
  }, [criteria.country, criteria.disciplines, criteria.from, criteria.to])

  function toggleDiscipline(discipline: EventType) {
    setCriteria((current) => ({
      ...current,
      disciplines: current.disciplines.includes(discipline)
        ? current.disciplines.filter((value) => value !== discipline)
        : [...current.disciplines, discipline],
    }))
  }

  return (
    <PageShell greeting={t('findRaces.greeting')} title={t('findRaces.title')}>
      <p className="mt-2 text-sm text-muted">{t('findRaces.subtitle')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="anchor" className="block text-sm font-semibold text-foreground">
            {t('findRaces.forAnchor')}
          </label>
          <select
            id="anchor"
            value={anchorRaceId}
            onChange={(event) => pickAnchor(event.target.value)}
            className={FIELD}
            disabled={anchors.length === 0}
          >
            <option value="">{t('common.dash')}</option>
            {anchors.map(({ race }) => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            {anchors.length === 0 ? t('findRaces.noAnchors') : t('findRaces.forAnchorHint')}
          </p>
        </div>

        <div>
          <label htmlFor="from" className="block text-sm font-semibold text-foreground">
            {t('findRaces.from')}
          </label>
          <DayField
            id="from"
            value={criteria.from || undefined}
            onChange={(day) => setCriteria({ ...criteria, from: day ?? '' })}
          />
        </div>

        <div>
          <label htmlFor="to" className="block text-sm font-semibold text-foreground">
            {t('findRaces.to')}
          </label>
          <DayField
            id="to"
            value={criteria.to || undefined}
            onChange={(day) => setCriteria({ ...criteria, to: day ?? '' })}
          />
        </div>

        {/* No list means no field: a disabled select is a control that does
            nothing when you click it, which is worse than one that is not
            there. The list comes from the harvest's status document, so an
            instance that has not harvested since upgrading has none yet. */}
        {countries.length > 0 ? (
          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-foreground">
              {t('findRaces.country')}
            </label>
            <select
              id="country"
              value={criteria.country}
              onChange={(event) => setCriteria({ ...criteria, country: event.target.value })}
              className={FIELD}
            >
              <option value="">{t('findRaces.anyCountry')}</option>
              {sortedCountries.map((code) => (
                <option key={code} value={code}>
                  {countryName(code, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="place" className="block text-sm font-semibold text-foreground">
            {t('findRaces.place')}
          </label>
          <input
            id="place"
            type="text"
            value={criteria.place}
            onChange={(event) => setCriteria({ ...criteria, place: event.target.value })}
            placeholder={t('findRaces.placePlaceholder')}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="radius" className="block text-sm font-semibold text-foreground">
            {t('findRaces.radius')}
          </label>
          <select
            id="radius"
            value={radiusKm ?? ''}
            onChange={(event) => setRadiusKm(readRadius(event.target.value))}
            className={FIELD}
          >
            <option value="">{t('findRaces.anyDistance')}</option>
            {RADIUS_OPTIONS.map((km) => (
              <option key={km} value={km}>
                {t('findRaces.radiusOption', { km })}
              </option>
            ))}
          </select>
          {radiusKm ? (
            <p className="mt-1 text-xs text-muted">
              {hasCentre ? (
                t('findRaces.radiusFrom', {
                  place: located ? t('findRaces.here') : criteria.place,
                })
              ) : (
                <button
                  type="button"
                  onClick={askForLocation}
                  disabled={locating}
                  className="font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {locating ? t('common.loading') : t('findRaces.useMyLocation')}
                </button>
              )}
            </p>
          ) : null}
          {locationRefused ? (
            <p className="mt-1 text-xs text-muted">{t('findRaces.locationRefused')}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <FilterBar>
          <FilterGroup label={t('bucketList.discipline')}>
            {disciplineOptions.map((discipline) => (
              <FilterPill
                key={discipline}
                active={criteria.disciplines.includes(discipline)}
                onClick={() => toggleDiscipline(discipline)}
              >
                {formatEventTypeLabel(discipline)}
              </FilterPill>
            ))}
          </FilterGroup>
        </FilterBar>
      </div>

      {!filtered ? (
        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <p className="text-sm text-foreground">{t('findRaces.pickAFilter')}</p>
          <p className="mt-1 text-xs text-muted">
            {countries.length > 0
              ? t('findRaces.pickAFilterHint', { count: countries.length })
              : t('findRaces.emptyCatalog')}
          </p>
        </div>
      ) : catalog === null || (searching && candidates.length === 0) ? (
        <p className="mt-6 text-sm text-muted">{t('common.loading')}</p>
      ) : candidates.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-surface p-5 text-sm text-muted">
          {t('findRaces.noMatches')}
        </p>
      ) : (
        <ul className="mt-6 rounded-xl border border-border bg-surface">
          {candidates.map((candidate) => {
            const pair = duplicatePairs.get(candidate.entry.id)
            return (
              <Fragment key={candidate.entry.id}>
                <Candidate
                  candidate={candidate}
                  marked={markedCatalogIds.has(candidate.entry.id)}
                  busy={adding === candidate.entry.id}
                  onMark={() => void handleMark(candidate.entry)}
                  onUnmark={() => void handleUnmark(candidate.entry)}
                  onSchedule={() => setEntryToSchedule(candidate.entry)}
                />
                {pair ? (
                  <DuplicateHint
                    left={pair[0]}
                    right={pair[1]}
                    onAnswer={(same) => answerDuplicate(pair[0], pair[1], same)}
                  />
                ) : null}
              </Fragment>
            )
          })}
        </ul>
      )}

      {radiusKm && hasCentre && circled.unplaced > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {t('findRaces.unplaced', { count: circled.unplaced })}
        </p>
      ) : null}

      {/* A full page means there is probably more behind it. */}
      {filtered && catalog !== null && catalog.length >= pageSize ? (
        <button
          type="button"
          onClick={() => setPageSize((current) => current + PAGE_SIZE)}
          disabled={searching}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-border/40 disabled:opacity-50"
        >
          {searching ? t('common.loading') : t('findRaces.more')}
        </button>
      ) : null}

      <NearbyParkruns
        knownSlugs={knownParkrunSlugs}
        place={criteria.place}
        onPlan={planParkrun}
        onWatch={watchParkrun}
        addedSlugs={watchedParkruns}
      />

      <ScheduleRaceDialog
        open={entryToSchedule !== null}
        race={entryToSchedule ? { name: entryToSchedule.name } : null}
        disciplines={entryToSchedule?.disciplines ?? []}
        offer={entryToSchedule ? prefillFromCatalog(entryToSchedule) : null}
        saving={scheduling}
        onCancel={() => setEntryToSchedule(null)}
        onConfirm={(eventType, day) => void handleSchedule(eventType, day)}
      />

      <p className="mt-4 text-xs text-muted">
        {syncedAt
          ? t('findRaces.syncedAt', { date: formatDatePt(syncedAt) })
          : t('findRaces.neverSynced')}{' '}
        <Link to={backToPlanning} className="font-semibold text-primary hover:underline">
          {t('findRaces.backToBucketList')}
        </Link>
      </p>
    </PageShell>
  )
}
