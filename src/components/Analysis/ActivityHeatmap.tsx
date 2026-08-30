import { useTranslation } from 'react-i18next'
import type { ActivityCalendar } from '../../utils/analytics/activity'

/** Cinco degraus chegam: a maioria das pessoas não faz mais de 4 provas num mês. */
function cellClass(races: number, maxRaces: number): string {
  if (races === 0) return 'bg-background'
  const step = Math.ceil((races / maxRaces) * 4)
  if (step <= 1) return 'bg-primary/25'
  if (step === 2) return 'bg-primary/45'
  if (step === 3) return 'bg-primary/70'
  return 'bg-primary'
}

/**
 * Grelha ano × mês. Mostra o que nenhuma média mostra: as épocas mortas, os
 * meses em que nunca se corre, e se o hábito está a ficar mais regular.
 */
export function ActivityHeatmap({ calendar }: { calendar: ActivityCalendar }) {
  const { t, i18n } = useTranslation()

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'narrow' })
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' })

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
      <table className="w-full min-w-[22rem] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10">
              <span className="sr-only">{t('common.year')}</span>
            </th>
            {Array.from({ length: 12 }, (_, month) => (
              <th
                key={month}
                scope="col"
                className="text-center text-[0.65rem] font-semibold uppercase text-muted"
              >
                {monthLabel.format(new Date(2026, month, 1))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendar.years.map((year) => (
            <tr key={year}>
              <th
                scope="row"
                className="pe-2 text-end text-xs font-semibold tracking-wider text-muted"
              >
                {year}
              </th>
              {calendar.cells
                .filter((cell) => cell.year === year)
                .map((cell) => (
                  <td key={cell.month} className="p-0">
                    <div
                      title={
                        cell.races === 0
                          ? `${monthName.format(new Date(2026, cell.month, 1))} ${year}`
                          : t('analysis.heatmapCell', {
                              month: monthName.format(new Date(2026, cell.month, 1)),
                              year,
                              count: cell.races,
                              km: Math.round(cell.distanceKm),
                            })
                      }
                      className={[
                        'aspect-square w-full rounded-[3px] ring-1 ring-inset ring-border',
                        cellClass(cell.races, calendar.maxRaces),
                      ].join(' ')}
                    />
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
