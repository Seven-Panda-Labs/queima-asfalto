import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ViewSwitcher } from '../ViewSwitcher'

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

  return (
    <div className="mt-6">
      <ViewSwitcher
        options={[
          { value: 'annual' as GoalKind, label: t('goals.typeAnnual') },
          { value: 'performance' as GoalKind, label: t('goals.typePerformance') },
        ]}
        value={active}
        onChange={(kind) => {
          if (kind !== active) navigate(PATHS[kind])
        }}
        label={t('goals.chooseType')}
      />
    </div>
  )
}
