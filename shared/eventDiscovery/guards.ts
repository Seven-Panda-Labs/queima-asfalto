/**
 * Refusing a bad harvest instead of publishing it.
 *
 * Discovery reads other people's HTML, so it will degrade: a template change, a
 * partial outage, a source that starts answering with an error page. Without a
 * floor, one bad afternoon replaces a good catalog with almost nothing, and the
 * page that finds races finds none. Same guard the parkrun catalog uses, and it
 * matters more here because these are scrapes.
 */
export const HARVEST_COLLAPSE_FLOOR = 0.8

/**
 * What a source has in the catalog now, to compare its next harvest against.
 *
 * The floor below only means something per source. A run that reads one of
 * seven brings back a fraction of the catalog, and comparing that fraction to
 * the whole would reject every run; comparing it to what that source itself
 * wrote is also a sharper guard than the old one, where a source going dark
 * was hidden by the volume of the other six.
 *
 * An entry written before a run read one source at a time carries the ids
 * joined, so both shapes are read here.
 */
export function storedForSources(
  entries: readonly { producer?: string; source?: string }[],
  sourceIds: readonly string[],
): number {
  const wanted = new Set(sourceIds)
  return entries.filter((entry) => {
    if (entry.producer !== 'harvest') return false
    return (entry.source ?? '')
      .split(',')
      .some((id) => wanted.has(id.trim()))
  }).length
}

export function isHarvestCollapse(
  storedCount: number,
  harvestedCount: number,
  floor = HARVEST_COLLAPSE_FLOOR,
): boolean {
  if (storedCount === 0) return false
  return harvestedCount < storedCount * floor
}

/** Beyond this a synced catalog stops being current enough to search silently. */
export const HARVEST_STALE_DAYS = 45

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function isHarvestStale(
  syncedAt: Date | undefined,
  today: Date = new Date(),
  staleDays = HARVEST_STALE_DAYS,
): boolean {
  if (!syncedAt) return true
  return today.getTime() - syncedAt.getTime() > staleDays * MS_PER_DAY
}

/**
 * Races worth harvesting at all.
 *
 * A race in the past cannot be entered, and a cancelled one should not be
 * suggested. Both still exist as pages the sitemap lists forever.
 *
 * A race with no distance is kept. Plenty of sources publish the date, the
 * town and the entry link and never say how long the thing is: davengo has the
 * start time to the minute and the distances only inside a Vaadin app. Dropping
 * those threw away most of a good calendar, so they arrive with no discipline
 * and the runner is asked for it when they add one, which is the shape the
 * review rule already asks for: suggest, never assert.
 */
export function isHarvestable(
  race: { startDate: string; cancelled: boolean },
  today: Date = new Date(),
): boolean {
  if (race.cancelled) return false
  const start = new Date(race.startDate)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() >= today.getTime()
}
