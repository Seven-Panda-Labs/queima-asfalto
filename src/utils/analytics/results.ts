import type { Event, EventType } from '../../types/Event'
import { parsePaceSeconds } from '../pace'
import { parseTime } from '../time'

/**
 * Distâncias oficiais das disciplinas. Servem de referência para converter
 * resultados entre distâncias; a distância que conta para o ritmo de uma prova
 * é sempre a `realDistance` medida, não esta.
 */
export const NOMINAL_DISTANCE_KM: Record<EventType, number> = {
  km_5: 5,
  km_10: 10,
  km_21_1: 21.0975,
  km_42_2: 42.195,
}

/**
 * Uma prova concluída com dados suficientes para entrar na análise.
 *
 * Havendo tempo, o ritmo é **derivado** de `time / realDistance` e não lido de
 * `event.pace`: o campo guardado é preenchido em separado do tempo (à mão ou por
 * importação) e arredondado ao segundo, por isso as duas fontes divergem. Para
 * agregar, a única que se pode somar sem enviesar é o tempo.
 */
export type AnalysableResult = {
  event: Event
  date: Date
  year: number
  eventType: EventType
  distanceKm: number
  timeSeconds: number
  paceSeconds: number
  /** O tempo foi reconstruído do ritmo por não haver tempo guardado. */
  timeFromPace: boolean
}

type Timing = { timeSeconds: number; paceSeconds: number; timeFromPace: boolean }

/**
 * A importação de Excel aceita uma coluna de ritmo sem coluna de tempo, por isso
 * há provas reais só com ritmo. Reconstruir o tempo a partir dele é melhor do
 * que deitar a prova fora — fica marcado, e o painel de dados continua a pedir
 * o tempo.
 */
function resolveTiming(event: Event, distanceKm: number): Timing | null {
  const storedTime = event.time ? parseTime(event.time) : null
  if (storedTime !== null && storedTime > 0) {
    return {
      timeSeconds: storedTime,
      paceSeconds: storedTime / distanceKm,
      timeFromPace: false,
    }
  }

  const storedPace = event.pace ? parsePaceSeconds(event.pace) : null
  if (storedPace !== null && storedPace > 0) {
    return {
      timeSeconds: storedPace * distanceKm,
      paceSeconds: storedPace,
      timeFromPace: true,
    }
  }

  return null
}

export function isAnalysableResult(event: Event): boolean {
  if (event.status !== 'completed') return false
  if (!Number.isFinite(event.realDistance) || event.realDistance <= 0) return false
  return resolveTiming(event, event.realDistance) !== null
}

function toAnalysableResult(event: Event): AnalysableResult | null {
  if (event.status !== 'completed') return null
  if (!Number.isFinite(event.realDistance) || event.realDistance <= 0) return null

  const timing = resolveTiming(event, event.realDistance)
  if (timing === null) return null

  return {
    event,
    date: event.date,
    year: event.date.getFullYear(),
    eventType: event.eventType,
    distanceKm: event.realDistance,
    ...timing,
  }
}

/** Provas analisáveis, da mais antiga para a mais recente. */
export function toAnalysableResults(events: Event[]): AnalysableResult[] {
  return events
    .map(toAnalysableResult)
    .filter((result): result is AnalysableResult => result !== null)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
}

export function formatPaceSeconds(paceSeconds: number): string {
  const rounded = Math.round(paceSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Assinado, para deltas: «-0:06» lê-se como seis segundos mais rápido. */
export function formatPaceDelta(deltaSeconds: number): string {
  const rounded = Math.round(deltaSeconds)
  if (rounded === 0) return `0:00`
  return `${rounded < 0 ? '-' : '+'}${formatPaceSeconds(Math.abs(rounded))}`
}

export function formatDurationSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  if (hours === 0) return `${minutes}:${String(seconds).padStart(2, '0')}`
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Horas arredondadas à décima, para «14.5h em prova». */
export function formatHours(totalSeconds: number): string {
  return (Math.round((totalSeconds / 3600) * 10) / 10).toString()
}

/**
 * Ritmo médio de um conjunto de provas: tempo total a dividir pela distância
 * total. Fazer a média dos ritmos individuais daria o mesmo peso a um 5K e a
 * uma maratona, o que sobrevaloriza as provas curtas.
 */
export function weightedAveragePaceSeconds(results: AnalysableResult[]): number | null {
  if (results.length === 0) return null

  let time = 0
  let distance = 0
  for (const result of results) {
    time += result.timeSeconds
    distance += result.distanceKm
  }

  return distance > 0 ? time / distance : null
}

export function totalDistanceKm(results: AnalysableResult[]): number {
  return results.reduce((sum, result) => sum + result.distanceKm, 0)
}

export function totalTimeSeconds(results: AnalysableResult[]): number {
  return results.reduce((sum, result) => sum + result.timeSeconds, 0)
}
