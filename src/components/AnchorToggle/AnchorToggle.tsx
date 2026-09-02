import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAnchorFor } from '../../domain/seasonAnchors'
import { findOrCreateRaceId, setRaceAnchorYear } from '../../services/races'
import { updateEvent } from '../../services/events'
import type { Event } from '../../types/Event'
import type { Race } from '../../types/Race'

type AnchorToggleProps = {
  event: Event
  races: readonly Race[]
  userId: string
  onChanged: () => void
}

/**
 * Marking one race as the anchor of its season, from the race itself.
 *
 * This is where a runner who plans straight into events can say it at all: the
 * flag used to live on the wish, which such a season never had. It works on a
 * past race too, because "my 2026 anchor" is a fact about a season that is over.
 */
export function AnchorToggle({ event, races, userId, onChanged }: AnchorToggleProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  const year = event.date.getFullYear()
  const race = races.find((candidate) => candidate.id === event.raceId)
  const isAnchor = race ? isAnchorFor(race, year) : false

  async function toggle() {
    setSaving(true)
    try {
      // An event from before the races collection has no identity yet, so the
      // first person to call it an anchor is the one who mints it.
      let raceId = event.raceId
      if (!raceId) {
        raceId =
          (await findOrCreateRaceId(userId, {
            name: event.name,
            location: event.location,
            locationLat: event.locationLat,
            locationLng: event.locationLng,
            locationGeocodeQuery: event.locationGeocodeQuery,
          })) ?? undefined
        if (!raceId) return
        await updateEvent(event.id, { raceId })
      }

      await setRaceAnchorYear(raceId, year, !isAnchor)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={saving}
      className={[
        'rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50',
        isAnchor
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-border text-muted hover:border-accent hover:text-accent',
      ].join(' ')}
      title={t('anchor.toggleHint')}
    >
      {isAnchor ? t('anchor.isAnchor', { year }) : t('anchor.makeAnchor', { year })}
    </button>
  )
}
