import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogProposal } from '../../../shared/raceCatalog'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { loadPendingProposals } from '../../services/catalogProposals'

/**
 * What runners proposed and the catalog has not answered yet.
 *
 * The job that turns a proposal into an entry runs once a day, so between a
 * runner being told their proposal was saved and it appearing anywhere there
 * was a window of up to a day in which nobody could see it, the operator
 * included. This is that window, made visible.
 *
 * Deliberately not a decision: accepting or refusing is the job's, applying
 * the same floor and the same duplicate rule the harvest does, and an entry
 * that lands wrong is retired or merged with the tools that already exist.
 */
export function CatalogProposals() {
  const { t } = useTranslation()
  const [proposals, setProposals] = useState<CatalogProposal[]>([])

  useEffect(() => {
    void loadPendingProposals().then(setProposals)
  }, [])

  if (proposals.length === 0) return null

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {t('admin.proposalsTitle', { count: proposals.length })}
      </h2>
      <p className="mt-1 text-xs text-muted">{t('admin.proposalsHint')}</p>

      <ul className="mt-3 divide-y divide-border">
        {proposals.map((proposal) => (
          <li
            key={`${proposal.name}-${proposal.raceDate}-${proposal.uid}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
          >
            <span className="font-semibold text-foreground">{proposal.name}</span>
            <span className="text-xs text-muted">
              {[proposal.city, proposal.country].filter(Boolean).join(', ')}
            </span>
            <span className="text-xs text-muted">{proposal.raceDate}</span>
            <span className="text-xs text-muted">
              {proposal.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
