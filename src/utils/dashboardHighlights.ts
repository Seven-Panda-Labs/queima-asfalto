import type { GoalOutcome, GoalWithProgress } from '../types/Goal'
import { formatGoalLabel, formatGoalOutcomeLabel } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import { formatPerformanceGoalLabel } from '../types/PerformanceGoal'
import type { BestPerformance } from './bestPerformances'
import i18n from '../i18n'

/** Um objetivo cumprido ou um recorde pessoal — sempre algo já conquistado. */
export type DashboardAchievement = {
  id: string
  tone: 'goal' | 'record'
  /** Ausente nos recordes, que usam a ilustração da medalha. */
  emoji?: string
  title: string
  /** O número da conquista: contagem, tempo ou estado. */
  detail: string
}

/** Um objetivo ainda por cumprir, com o progresso atual. */
export type DashboardTarget = {
  id: string
  emoji: string
  title: string
  /** 0–100. */
  percent: number
  /** Progresso curto ao lado da barra: «2/3» ou «99%». */
  progressText: string
  /** Contexto opcional (metas de performance). */
  hint?: string
}

export type DashboardHighlights = {
  achievements: DashboardAchievement[]
  targets: DashboardTarget[]
  /** Frase da marca para a conquista mais impressionante do ano, se houver. */
  voiceLine: string | null
}

const ACHIEVED_OUTCOMES: GoalOutcome[] = ['achieved', 'exceeded', 'crushed']

/** Do mais impressionante para o menos, para escolher a frase da marca. */
const OUTCOME_RANK: Record<GoalOutcome, number> = {
  crushed: 3,
  exceeded: 2,
  achieved: 1,
  in_progress: 0,
  failed: 0,
}

function byPercentDescending(a: DashboardTarget, b: DashboardTarget): number {
  if (b.percent !== a.percent) return b.percent - a.percent
  return a.title.localeCompare(b.title)
}

function pickVoiceLine(goals: GoalWithProgress[]): string | null {
  const best = goals.reduce<GoalWithProgress | null>((current, goal) => {
    if (OUTCOME_RANK[goal.outcome] === 0) return current
    if (!current || OUTCOME_RANK[goal.outcome] > OUTCOME_RANK[current.outcome]) return goal
    return current
  }, null)

  return best ? formatGoalOutcomeLabel(best.outcome) : null
}

export function computeDashboardHighlights(
  goals: GoalWithProgress[],
  performanceGoals: PerformanceGoalWithProgress[],
  bestPerformances: BestPerformance[],
): DashboardHighlights {
  const achievements: DashboardAchievement[] = []
  const targets: DashboardTarget[] = []

  for (const goal of goals) {
    if (ACHIEVED_OUTCOMES.includes(goal.outcome)) {
      achievements.push({
        id: `goal-${goal.id}`,
        tone: 'goal',
        emoji: goal.emoji ?? '🏅',
        title: formatGoalLabel(goal),
        detail: `${goal.currentCount}/${goal.targetCount}`,
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
        tone: 'goal',
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

  for (const performance of bestPerformances) {
    achievements.push({
      id: `record-${performance.eventId}`,
      tone: 'record',
      title: performance.label,
      detail: performance.time,
    })
  }

  targets.sort(byPercentDescending)

  return { achievements, targets, voiceLine: pickVoiceLine(goals) }
}
