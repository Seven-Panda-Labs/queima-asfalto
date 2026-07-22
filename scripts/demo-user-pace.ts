const TIME_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})$/

export function paceFromTime(time: string, distanceKm: number): string | null {
  if (distanceKm <= 0) return null

  const match = TIME_PATTERN.exec(time.trim())
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (minutes > 59 || seconds > 59) return null

  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  if (totalSeconds <= 0) return null

  const paceSeconds = Math.round(totalSeconds / distanceKm)
  const paceMinutes = Math.floor(paceSeconds / 60)
  const paceSecs = paceSeconds % 60

  return `${paceMinutes}:${String(paceSecs).padStart(2, '0')}`
}
