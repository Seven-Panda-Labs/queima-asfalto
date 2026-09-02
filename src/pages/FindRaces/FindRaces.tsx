import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../../components/PageShell/PageShell'
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
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import { canAssertDates } from '../../../shared/raceCatalog'
import {
  catalogRaceToBucketListItem,
  findOrCreateCatalogRaceId,
  loadHarvestSyncedAt,
  loadRaceCatalog,
} from '../../services/raceCatalog'
import { formatDatePt } from '../../utils/date'
import type { EventType } from '../../types/Event'

const FIELD = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm'

/** `YYYY-MM-DD`, which is what a native date input wants. */
function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function Candidate({
  candidate,
  added,
  adding,
  onAdd,
}: {
  candidate: DiscoveryCandidate
  added: boolean
  adding: boolean
  onAdd: () => void
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
        {entry.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')}
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
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t('findRaces.openSource')}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onAdd}
          disabled={added || adding}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {added ? t('findRaces.added') : t('findRaces.add')}
        </button>
      </div>
    </li>
  )
}

/**
 * Races the runner does not know about yet.
 *
 * The catalog is searched here rather than fetched per query: the sources have
 * no filtering endpoint, so a live search would mean pulling their whole
 * calendar every time somebody typed. What the page owes in return is honesty
 * about how current the catalog is.
 */
export function FindRaces() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const { items, addItem } = useBucketList()
  const { entries: raceEntries } = useRaceEntries()
  const { races } = useRaces()
  const { allEvents } = useEvents()
  const { enabledDisciplines } = useDisciplines()

  const [catalog, setCatalog] = useState<RaceCatalogEntry[] | null>(null)
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)
  const [criteria, setCriteria] = useState<DiscoveryCriteria>(EMPTY_CRITERIA)
  const [anchorRaceId, setAnchorRaceId] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<string[]>([])

  useEffect(() => {
    void loadRaceCatalog().then(setCatalog)
    void loadHarvestSyncedAt().then(setSyncedAt)
  }, [])

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

  const candidates = useMemo(
    () => (catalog ? findCandidates(catalog, criteria, { anchor }) : []),
    [anchor, catalog, criteria],
  )

  const disciplineOptions = useMemo(
    () => visibleDisciplines(enabledDisciplines, criteria.disciplines),
    [criteria.disciplines, enabledDisciplines],
  )

  async function handleAdd(entry: RaceCatalogEntry) {
    if (!user) return
    setAdding(entry.id)
    try {
      const raceId = await findOrCreateCatalogRaceId(user.uid, entry)
      await addItem(catalogRaceToBucketListItem(entry, raceId, anchor?.id))
      setAddedIds((current) => [...current, entry.id])
      toast.success(t('findRaces.addedToast', { name: entry.name }))
    } catch {
      toast.error(t('findRaces.addError'))
    } finally {
      setAdding(null)
    }
  }

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
          <input
            id="from"
            type="date"
            value={criteria.from}
            onChange={(event) => setCriteria({ ...criteria, from: event.target.value })}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="to" className="block text-sm font-semibold text-foreground">
            {t('findRaces.to')}
          </label>
          <input
            id="to"
            type="date"
            value={criteria.to}
            onChange={(event) => setCriteria({ ...criteria, to: event.target.value })}
            className={FIELD}
          />
        </div>

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

      {catalog === null ? (
        <p className="mt-6 text-sm text-muted">{t('common.loading')}</p>
      ) : catalog.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-surface p-5 text-sm text-muted">
          {t('findRaces.emptyCatalog')}
        </p>
      ) : candidates.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-surface p-5 text-sm text-muted">
          {t('findRaces.noMatches')}
        </p>
      ) : (
        <ul className="mt-6 rounded-xl border border-border bg-surface">
          {candidates.map((candidate) => (
            <Candidate
              key={candidate.entry.id}
              candidate={candidate}
              added={addedIds.includes(candidate.entry.id)}
              adding={adding === candidate.entry.id}
              onAdd={() => void handleAdd(candidate.entry)}
            />
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted">
        {syncedAt
          ? t('findRaces.syncedAt', { date: formatDatePt(syncedAt) })
          : t('findRaces.neverSynced')}{' '}
        <Link to="/bucket-list" className="font-semibold text-primary hover:underline">
          {t('findRaces.backToBucketList')}
        </Link>
      </p>
    </PageShell>
  )
}
