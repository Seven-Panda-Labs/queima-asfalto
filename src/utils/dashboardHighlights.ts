import type { GoalOutcome, GoalWithProgress } from '../types/Goal'
import { formatGoalLabel, formatGoalOutcomeShortLabel } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import { formatPerformanceGoalLabel } from '../types/PerformanceGoal'
import i18n from '../i18n'

/**
 * Um objetivo do ano já cumprido. Os recordes de sempre ficam de fora de
 * propósito: têm bloco próprio, para não misturar escalas de tempo.
 */
export type DashboardAchievement = {
  id: string
  emoji: string
  title: string
  /** O desfecho: «Destruída 👊», «Meta batida!». */
  detail: string
}

/** Um objetivo ainda por cumprir, com o progresso atual. */
export type DashboardTarget = {
  id: string
  emoji: string
  title: string
  /** 0 a 100. */
  percent: number
  /** Progresso curto ao lado da barra: «2/3» ou «99%». */
  progressText: string
  /** Contexto opcional (metas de performance). */
  hint?: string
}

export type DashboardHighlights = {
  achievements: DashboardAchievement[]
  targets: DashboardTarget[]
}

const ACHIEVED_OUTCOMES: GoalOutcome[] = ['achieved', 'exceeded', 'crushed']

function byPercentDescending(a: DashboardTarget, b: DashboardTarget): number {
  if (b.percent !== a.percent) return b.percent - a.percent
  return a.title.localeCompare(b.title)
}


export function computeDashboardHighlights(
  goals: GoalWithProgress[],
  performanceGoals: PerformanceGoalWithProgress[],
): DashboardHighlights {
  const achievements: DashboardAchievement[] = []
  const targets: DashboardTarget[] = []

  for (const goal of goals) {
    if (ACHIEVED_OUTCOMES.includes(goal.outcome)) {
      achievements.push({
        id: `goal-${goal.id}`,
        emoji: goal.emoji ?? '🏅',
        title: formatGoalLabel(goal),
        detail: formatGoalOutcomeShortLabel(goal.outcome),
      })
      continue
    }

    targets.push({
      id: `goal-${goal.id}`,
      emoji: goal.emoji ?? '🏃',
      title: formatGoalLabel(goal),
      percent: Math.round(goal.percent),
      progressText: `${goal.currentCount}/${goal.targetCount}`,
    })
  }

  for (const goal of performanceGoals) {
    if (goal.status === 'achieved') {
      achievements.push({
        id: `performance-${goal.id}`,
        emoji: goal.emoji ?? '⚡',
        title: formatPerformanceGoalLabel(goal),
        detail: i18n.t('goals.outcomeAchieved'),
      })
      continue
    }

    targets.push({
      id: `performance-${goal.id}`,
      emoji: goal.emoji ?? '⚡',
      title: formatPerformanceGoalLabel(goal),
      percent: Math.round(goal.percent),
      progressText: `${Math.round(goal.percent)}%`,
      hint: goal.progressLabel,
    })
  }

  targets.sort(byPercentDescending)

  return { achievements, targets }
}
