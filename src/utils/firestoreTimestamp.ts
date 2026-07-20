export function parseFirestoreTimestamp(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }

  if (value && typeof value === 'object') {
    if ('toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate()
    }

    const record = value as {
      _seconds?: unknown
      seconds?: unknown
      _nanoseconds?: unknown
      nanoseconds?: unknown
    }
    const seconds = record._seconds ?? record.seconds
    if (typeof seconds === 'number') {
      const nanoseconds = record._nanoseconds ?? record.nanoseconds
      const millis =
        seconds * 1000 +
        (typeof nanoseconds === 'number' ? Math.floor(nanoseconds / 1_000_000) : 0)
      return new Date(millis)
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  if (typeof value === 'number') {
    return new Date(value < 1e12 ? value * 1000 : value)
  }

  return new Date(0)
}
