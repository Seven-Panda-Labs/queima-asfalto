import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewSwitcher } from '../ViewSwitcher'
import type { ActivityCalendar, ActivityCell } from '../../utils/analytics/activity'

type HeatmapMetric = 'races' | 'distance'

/** Five steps is enough for the range this data has. */
function cellClass(value: number, max: number): string {
  if (value === 0 || max === 0) return 'bg-background'
  const step = Math.ceil((value / max) * 4)
  if (step <= 1) return 'bg-primary/25'
  if (step === 2) return 'bg-primary/45'
  if (step === 3) return 'bg-primary/70'
  return 'bg-primary'
}

function cellValue(cell: ActivityCell, metric: HeatmapMetric): number {
  return metric === 'races' ? cell.races : cell.distanceKm
}

/**
 * Year by month. Two readings, because they count different things: races
 * measure how often you started, kilometres measure how much you ran, and a
 * month with a marathon in it is not a weak month.
 */
export function ActivityHeatmap({ calendar }: { calendar: ActivityCalendar }) {
  const { t, i18n } = useTranslation()
  const [metric, setMetric] = useState<HeatmapMetric>('races')

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'narrow' })
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' })
  const max = metric === 'races' ? calendar.maxRaces : calendar.maxDistanceKm

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex justify-end">
        <ViewSwitcher
          options={[
            { value: 'races' as const, label: t('analysis.heatmapMetricRaces') },
            { value: 'distance' as const, label: t('analysis.heatmapMetricDistance') },
          ]}
          value={metric}
          onChange={setMetric}
          label={t('analysis.heatmapMetricLabel')}
        />
      </div>

      <div className="overflow-x-auto">
        {/* `table-fixed`: otherwise columns size to the month initials, and
            cells end up different widths for no reason. */}
        <table className="w-full min-w-[30rem] table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-12">
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
                        /* Fixed height, elastic width: with only twelve
                           columns, squares filling the width would be 100px a
                           side and the section half a screen tall. */
                        className={[
                          'h-8 w-full rounded-md ring-1 ring-inset ring-border sm:h-10',
                          cellClass(cellValue(cell, metric), max),
                        ].join(' ')}
                      />
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
