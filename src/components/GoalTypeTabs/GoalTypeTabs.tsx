import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

type GoalKind = 'annual' | 'performance'

const PATHS: Record<GoalKind, string> = {
  annual: '/objetivos/novo',
  performance: '/objetivos/performance/novo',
}

/**
 * Anual ou de performance é uma distinção do modelo de dados, não de quem usa
 * a app: cria-se «um objetivo» e escolhe-se aqui o que se quer medir. Só
 * aparece ao criar, porque o tipo de um objetivo existente não muda.
 */
export function GoalTypeTabs({ active }: { active: GoalKind }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const options: { kind: GoalKind; label: string }[] = [
    { kind: 'annual', label: t('goals.typeAnnual') },
    { kind: 'performance', label: t('goals.typePerformance') },
  ]

  return (
    <div
      role="group"
      aria-label={t('goals.chooseType')}
      className="mt-6 inline-flex rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => (
        <button
          key={option.kind}
          type="button"
          aria-pressed={option.kind === active}
          onClick={() => {
            if (option.kind !== active) navigate(PATHS[option.kind])
          }}
          className={[
            'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
            option.kind === active
              ? 'bg-primary text-white'
              : 'text-muted hover:text-foreground',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
