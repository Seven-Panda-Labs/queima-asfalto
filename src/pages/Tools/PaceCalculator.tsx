import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageShell } from '../../components/PageShell/PageShell'
import { ViewSwitcher } from '../../components/ViewSwitcher/ViewSwitcher'
import { useDisciplines } from '../../contexts/DisciplinesContext'
import { NOMINAL_DISTANCE_KM } from '../../domain/eventCodes'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import {
  formatDistanceInput,
  fromKm,
  paceToSecondsPerKm,
  parseDistanceKm,
  partsToSeconds,
  secondsPerKmToPace,
  solvePace,
  toKm,
  type DistanceUnit,
  type PaceTarget,
} from '../../utils/paceCalculator'
import { TOOLS_PATH } from './Tools'

const input = 'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2'

function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={input}
      />
    </div>
  )
}

export function PaceCalculator() {
  const { t, i18n } = useTranslation()
  const { enabledDisciplines } = useDisciplines()
  const [target, setTarget] = useState<PaceTarget>('pace')
  const [distance, setDistance] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [paceMinutes, setPaceMinutes] = useState('')
  const [paceSeconds, setPaceSeconds] = useState('')
  const [unit, setUnit] = useState<DistanceUnit>('km')

  const enteredDistance = parseDistanceKm(distance)
  const enteredPace = partsToSeconds([paceMinutes, paceSeconds])
  const result = solvePace(target, {
    distanceKm: enteredDistance === null ? null : toKm(enteredDistance, unit),
    timeSeconds: partsToSeconds([hours, minutes, seconds]),
    paceSecondsPerKm: enteredPace === null ? null : paceToSecondsPerKm(enteredPace, unit),
  })

  const decimal = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 })
  const otherUnit: DistanceUnit = unit === 'km' ? 'mi' : 'km'
  const paceIn = (paceUnit: DistanceUnit, secondsPerKm: number) =>
    t(`tools.paceCalculator.pacePer.${paceUnit}`, {
      pace: formatPaceSeconds(secondsPerKmToPace(secondsPerKm, paceUnit)),
    })

  // Converts what is already typed, so 10 km does not silently become 10 miles.
  const changeUnit = (next: DistanceUnit) => {
    if (next === unit) return
    if (enteredDistance !== null) setDistance(formatDistanceInput(toKm(enteredDistance, unit), next))
    if (enteredPace !== null) {
      const converted = Math.round(secondsPerKmToPace(paceToSecondsPerKm(enteredPace, unit), next))
      setPaceMinutes(String(Math.floor(converted / 60)))
      setPaceSeconds(String(converted % 60).padStart(2, '0'))
    }
    setUnit(next)
  }

  return (
    <PageShell title={t('tools.paceCalculator.title')}>
      <Link to={TOOLS_PATH} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
        {t('tools.back')}
      </Link>

      <div className="mt-6 max-w-2xl space-y-6">
        <div className="flex flex-wrap gap-x-8 gap-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{t('tools.paceCalculator.solveFor')}</p>
            <ViewSwitcher
              label={t('tools.paceCalculator.solveFor')}
              value={target}
              onChange={setTarget}
              options={(['pace', 'time', 'distance'] as const).map((value) => ({
                value,
                label: t(`tools.paceCalculator.fields.${value}`),
              }))}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">{t('tools.paceCalculator.unit')}</p>
            <ViewSwitcher
              label={t('tools.paceCalculator.unit')}
              value={unit}
              onChange={changeUnit}
              options={(['km', 'mi'] as const).map((value) => ({
                value,
                label: t(`tools.paceCalculator.unitNames.${value}`),
              }))}
            />
          </div>
        </div>

        {target !== 'distance' ? (
          <div>
            <label htmlFor="distance" className="block text-sm font-semibold text-foreground">
              {t(`tools.paceCalculator.distanceLabel.${unit}`)}
            </label>
            <input
              id="distance"
              type="text"
              inputMode="decimal"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="10"
              className={`${input} max-w-xs`}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {enabledDisciplines.map((eventType) => (
                <button
                  key={eventType}
                  type="button"
                  onClick={() => setDistance(formatDistanceInput(NOMINAL_DISTANCE_KM[eventType], unit))}
                  className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-foreground hover:border-primary"
                >
                  {formatEventTypeLabel(eventType)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {target !== 'time' ? (
          <fieldset>
            <legend className="block text-sm font-semibold text-foreground">
              {t('tools.paceCalculator.fields.time')}
            </legend>
            <div className="mt-2 grid max-w-md grid-cols-3 gap-3">
              <NumberInput id="hours" label={t('resultsForm.hours')} value={hours} onChange={setHours} placeholder="0" />
              <NumberInput id="minutes" label={t('resultsForm.minutes')} value={minutes} onChange={setMinutes} placeholder="45" />
              <NumberInput id="seconds" label={t('resultsForm.seconds')} value={seconds} onChange={setSeconds} placeholder="00" />
            </div>
          </fieldset>
        ) : null}

        {target !== 'pace' ? (
          <fieldset>
            <legend className="block text-sm font-semibold text-foreground">
              {t('tools.paceCalculator.fields.pace')} {t(`tools.paceCalculator.units.${unit}`)}
            </legend>
            <div className="mt-2 grid max-w-xs grid-cols-2 gap-3">
              <NumberInput id="paceMinutes" label={t('resultsForm.minutes')} value={paceMinutes} onChange={setPaceMinutes} placeholder="5" />
              <NumberInput id="paceSeconds" label={t('resultsForm.seconds')} value={paceSeconds} onChange={setPaceSeconds} placeholder="00" />
            </div>
          </fieldset>
        ) : null}

        <section
          aria-live="polite"
          aria-label={t('tools.paceCalculator.result')}
          className="rounded-lg border border-border bg-surface p-5"
        >
          {result ? (
            <>
              <p className="text-sm text-muted">{t(`tools.paceCalculator.fields.${target}`)}</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-4xl tracking-wide text-primary">
                  {target === 'pace' ? formatPaceSeconds(secondsPerKmToPace(result.paceSecondsPerKm, unit)) : null}
                  {target === 'time' ? formatDurationSeconds(result.timeSeconds) : null}
                  {target === 'distance' ? decimal.format(fromKm(result.distanceKm, unit)) : null}
                </span>
                {target === 'pace' ? <span className="text-muted">{t(`tools.paceCalculator.units.${unit}`)}</span> : null}
                {target === 'distance' ? <span className="text-muted">{t(`tools.paceCalculator.unitNames.${unit}`)}</span> : null}
              </p>
              {target === 'pace' ? (
                <p className="mt-1 text-sm text-muted">{paceIn(otherUnit, result.paceSecondsPerKm)}</p>
              ) : null}
              {target === 'distance' ? (
                <p className="mt-1 text-sm text-muted">
                  {t(`tools.paceCalculator.distanceIn.${otherUnit}`, {
                    distance: decimal.format(fromKm(result.distanceKm, otherUnit)),
                  })}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">{t(`tools.paceCalculator.empty.${target}`)}</p>
          )}
        </section>
      </div>
    </PageShell>
  )
}
