export const KM_PER_MILE = 1.609344

export type DistanceUnit = 'km' | 'mi'

export type PaceTarget = 'pace' | 'time' | 'distance'

/** Accepts a decimal comma, since most of the locales write 21,1. */
export function parseDistanceKm(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  const km = Number(trimmed)
  return km > 0 ? km : null
}

/** Blank parts count as zero; returns null when the whole thing is blank, zero or malformed. */
export function partsToSeconds(parts: string[]): number | null {
  if (parts.every((part) => part.trim() === '')) return null
  let total = 0
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed !== '' && !/^\d+$/.test(trimmed)) return null
    total = total * 60 + (trimmed === '' ? 0 : Number(trimmed))
  }
  return total > 0 ? total : null
}

export function toKm(distance: number, unit: DistanceUnit): number {
  return unit === 'mi' ? distance * KM_PER_MILE : distance
}

export function fromKm(km: number, unit: DistanceUnit): number {
  return unit === 'mi' ? km / KM_PER_MILE : km
}

export function paceToSecondsPerKm(seconds: number, unit: DistanceUnit): number {
  return unit === 'mi' ? seconds / KM_PER_MILE : seconds
}

export function secondsPerKmToPace(secondsPerKm: number, unit: DistanceUnit): number {
  return unit === 'mi' ? secondsPerKm * KM_PER_MILE : secondsPerKm
}

/** Three decimals keep a marathon in miles within a second of the real time. */
export function formatDistanceInput(km: number, unit: DistanceUnit): string {
  return String(Number(fromKm(km, unit).toFixed(3)))
}

export type PaceInputs = {
  distanceKm: number | null
  timeSeconds: number | null
  paceSecondsPerKm: number | null
}

export type PaceResult = {
  distanceKm: number
  timeSeconds: number
  paceSecondsPerKm: number
}

/** Solves the missing one of distance, time and pace; null until the other two are known. */
export function solvePace(target: PaceTarget, inputs: PaceInputs): PaceResult | null {
  const { distanceKm, timeSeconds, paceSecondsPerKm } = inputs
  switch (target) {
    case 'pace':
      if (distanceKm === null || timeSeconds === null) return null
      return { distanceKm, timeSeconds, paceSecondsPerKm: timeSeconds / distanceKm }
    case 'time':
      if (distanceKm === null || paceSecondsPerKm === null) return null
      return { distanceKm, timeSeconds: paceSecondsPerKm * distanceKm, paceSecondsPerKm }
    case 'distance':
      if (timeSeconds === null || paceSecondsPerKm === null) return null
      return { distanceKm: timeSeconds / paceSecondsPerKm, timeSeconds, paceSecondsPerKm }
  }
}
