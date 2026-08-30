import type { Event } from '../types/Event'
import {
  formatPaceSeconds,
  toAnalysableResults,
  weightedAveragePaceSeconds,
} from './analytics/results'

export type DashboardStats = {
  totalEvents: number
  completedCount: number
  missedCount: number
  /** Ritmo médio do ano, ponderado pela distância. */
  averagePace: string | null
  /** Soma da distância real das provas concluídas no ano, arredondada à décima. */
  completedDistanceKm: number
}

function eventsInYear(events: Event[], year: number): Event[] {
  return events.filter(
    (event) => event.date.getFullYear() === year && event.status !== 'cancelled',
  )
}

export function computeDashboardStats(events: Event[], year: number): DashboardStats {
  const yearEvents = eventsInYear(events, year)
  const completed = yearEvents.filter((event) => event.status === 'completed')
  const missed = yearEvents.filter((event) => event.status === 'missed')

  // Tempo total a dividir pela distância total. A média dos ritmos individuais
  // daria o mesmo peso a um 5K e a uma maratona, e a página de análise mostraria
  // um número diferente para o mesmo ano.
  const averageSeconds = weightedAveragePaceSeconds(toAnalysableResults(completed))
  const averagePace = averageSeconds === null ? null : formatPaceSeconds(averageSeconds)

  const distanceSum = completed.reduce(
    (sum, event) => sum + (Number.isFinite(event.realDistance) ? event.realDistance : 0),
    0,
  )

  return {
    totalEvents: yearEvents.length,
    completedCount: completed.length,
    missedCount: missed.length,
    averagePace,
    completedDistanceKm: Math.round(distanceSum * 10) / 10,
  }
}
