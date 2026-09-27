import type { WeightEntry } from '../types/WeightEntry'

/** Mirrors the range in firestore.rules. */
export const MIN_WEIGHT_KG = 20
export const MAX_WEIGHT_KG = 400

/** Accepts a decimal comma, and keeps one decimal: a bathroom scale reads no finer. */
export function parseWeightKg(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  const kg = Math.round(Number(trimmed) * 10) / 10
  return kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG ? kg : null
}

type Weighing = Pick<WeightEntry, 'date' | 'weightKg'>

export function sortByDate<T extends Weighing>(entries: readonly T[]): T[] {
  return [...entries].sort((left, right) => left.date.localeCompare(right.date))
}

function daysBefore(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

export type WeightSummary = {
  latestKg: number
  /** Change over the last N days; null while nothing else falls in that window. */
  last7DaysKg: number | null
  last30DaysKg: number | null
  totalKg: number | null
}

/**
 * Each window compares the latest weigh-in with the earliest one inside it. An
 * older weigh-in outside the window is not used: a gap of a month would
 * otherwise show as a week's change.
 */
export function summarizeWeights(entries: readonly Weighing[]): WeightSummary | null {
  const sorted = sortByDate(entries)
  const latest = sorted.at(-1)
  if (!latest) return null

  const changeWithin = (days: number): number | null => {
    const start = daysBefore(latest.date, days)
    const first = sorted.find((entry) => entry.date >= start)
    return first && first !== latest ? roundKg(latest.weightKg - first.weightKg) : null
  }

  return {
    latestKg: latest.weightKg,
    last7DaysKg: changeWithin(7),
    last30DaysKg: changeWithin(30),
    totalKg: sorted.length > 1 ? roundKg(latest.weightKg - sorted[0]!.weightKg) : null,
  }
}

function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10
}
