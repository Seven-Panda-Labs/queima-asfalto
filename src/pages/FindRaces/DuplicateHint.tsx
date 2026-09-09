import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'

/**
 * The question a runner can answer and the harvest cannot.
 *
 * Two entries on the same day in the same town over the same distance, whose
 * names agree on nothing a rule can use: "ProPotsdam Schlosserlauf" and
 * "22. Pro Potsdam Schlosserlauf 2027". A person reading both rows knows in a
 * second, and the search page has them one under the other because it orders by
 * date.
 *
 * Deliberately quiet, and asked once. It states what happens to the answer,
 * because "the same race" sounds like it deletes one of them and it does not:
 * the answer moves the pair up a queue a person still works through.
 */
export function DuplicateHint({
  left,
  right,
  onAnswer,
}: {
  left: RaceCatalogEntry
  right: RaceCatalogEntry
  onAnswer: (same: boolean) => Promise<void> | void
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  const answer = async (same: boolean) => {
    setBusy(true)
    try {
      await onAnswer(same)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="border-b border-border bg-border/20 px-4 py-2 last:border-b-0">
      <p className="text-xs text-muted">
        {t('findRaces.duplicateAsk', { left: left.name, right: right.name })}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void answer(true)}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {t('findRaces.duplicateSame')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void answer(false)}
          className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {t('findRaces.duplicateDifferent')}
        </button>
      </div>
    </li>
  )
}
