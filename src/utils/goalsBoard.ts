import type { GoalWithProgress } from '../types/Goal'
import { formatGoalLabel, formatGoalOutcomeShortLabel } from '../types/Goal'
import type { PerformanceGoalWithProgress } from '../types/PerformanceGoal'
import { formatPerformanceGoalLabel } from '../types/PerformanceGoal'
import i18n from '../i18n'

/**
 * Objetivos anuais e metas de performance na mesma forma. São a mesma coisa
 * para quem olha, e a página agrupa-os por estado, não por tipo.
 */
export type GoalBoardEntry = {
  /** Único na página; os ids das duas coleções podem colidir. */
  id: string
  kind: 'annual' | 'performance'
  sourceId: string
  emoji: string
  title: string
  /** «Objetivo anual» ou «Meta de performance»: o tipo lê-se no cartão. */
  typeLabel: string
  /** Contexto das metas de performance: melhor do ano, alvo, PR histórico. */
  hint?: string
  /** 0 a 100. */
  percent: number
  /** «2/3» ou «99%». */
  progressText: string
  /**
   * Se uma barra diz alguma coisa. Um PR só pode ser batido ou não, e uma meta
   * sem provas concluídas não tem progresso: nesses casos a barra só sabe
   * mostrar vazio, o que se lê como fracasso.
   */
  measurable: boolean
  /**
   * `failed` só acontece em anos que já passaram: o prazo acabou e o objetivo
   * não foi cumprido, portanto não é «a caminho» de lado nenhum.
   */
  state: 'pending' | 'done' | 'failed'
  outcomeLabel?: string
  editPath: string
}

export type GoalsBoard = {
  pending: GoalBoardEntry[]
  done: GoalBoardEntry[]
  failed: GoalBoardEntry[]
}

function byPercentDescending(a: GoalBoardEntry, b: GoalBoardEntry): number {
  if (a.measurable !== b.measurable) return a.measurable ? -1 : 1
  if (b.percent !== a.percent) return b.percent - a.percent
  return a.title.localeCompare(b.title)
}

function byTitle(a: GoalBoardEntry, b: GoalBoardEntry): number {
  return a.title.localeCompare(b.title)
}

const ANNUAL_DONE = new Set(['achieved', 'exceeded', 'crushed'])

export function computeGoalsBoard(
  goals: GoalWithProgress[],
  performanceGoals: PerformanceGoalWithProgress[],
): GoalsBoard {
  const pending: GoalBoardEntry[] = []
  const done: GoalBoardEntry[] = []
  const failed: GoalBoardEntry[] = []

  for (const goal of goals) {
    const entry: GoalBoardEntry = {
      id: `annual-${goal.id}`,
      kind: 'annual',
      sourceId: goal.id,
      emoji: goal.emoji ?? '🏅',
      title: formatGoalLabel(goal),
      typeLabel: i18n.t('goals.typeAnnual'),
      percent: Math.round(goal.percent),
      progressText: `${goal.currentCount}/${goal.targetCount}`,
      measurable: true,
      state: 'pending',
      editPath: `/objetivos/${goal.id}/editar`,
    }

    if (ANNUAL_DONE.has(goal.outcome)) {
      done.push({
        ...entry,
        state: 'done',
        outcomeLabel: formatGoalOutcomeShortLabel(goal.outcome),
      })
    } else if (goal.outcome === 'failed') {
      failed.push({
        ...entry,
        state: 'failed',
        outcomeLabel: formatGoalOutcomeShortLabel(goal.outcome),
      })
    } else {
      pending.push(entry)
    }
  }

  for (const goal of performanceGoals) {
    const measurable = goal.status !== 'no_data' && goal.type !== 'pr_target'
    const entry: GoalBoardEntry = {
      id: `performance-${goal.id}`,
      kind: 'performance',
      sourceId: goal.id,
      emoji: goal.emoji ?? '⚡',
      title: formatPerformanceGoalLabel(goal),
      typeLabel: i18n.t('goals.typePerformance'),
      hint: goal.progressLabel,
      percent: Math.round(goal.percent),
      progressText: measurable
        ? `${Math.round(goal.percent)}%`
        : goal.status === 'no_data'
          ? i18n.t('goals.performanceNoData')
          : i18n.t('goals.performanceInProgress'),
      measurable,
      state: 'pending',
      editPath: `/objetivos/performance/${goal.id}/editar`,
    }

    if (goal.status === 'achieved') {
      done.push({ ...entry, state: 'done', outcomeLabel: i18n.t('goals.outcomeAchieved') })
    } else if (goal.status === 'failed') {
      failed.push({ ...entry, state: 'failed', outcomeLabel: i18n.t('goals.performanceFailed') })
    } else {
      pending.push(entry)
    }
  }

  pending.sort(byPercentDescending)
  done.sort(byTitle)
  failed.sort(byTitle)

  return { pending, done, failed }
}
