import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ScaleIcon, StopwatchIcon } from '../../components/icons/statIcons'
import { PageShell } from '../../components/PageShell/PageShell'

export const TOOLS_PATH = '/ferramentas'
export const PACE_CALCULATOR_PATH = `${TOOLS_PATH}/ritmo`
export const WEIGHT_LOG_PATH = `${TOOLS_PATH}/peso`

/**
 * Small helpers for preparing a season. Each tool stands alone: none reads or
 * writes events, goals or planning.
 */
const tools = [
  { to: PACE_CALCULATOR_PATH, key: 'paceCalculator', Icon: StopwatchIcon },
  { to: WEIGHT_LOG_PATH, key: 'weightLog', Icon: ScaleIcon },
] as const

export function Tools() {
  const { t } = useTranslation()

  return (
    <PageShell title={t('tools.title')}>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {tools.map(({ to, key, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex h-full flex-col items-center gap-3 rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-primary"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary">
                <Icon className="h-8 w-8" />
              </span>
              <span className="text-sm font-semibold text-foreground">{t(`tools.${key}.title`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
