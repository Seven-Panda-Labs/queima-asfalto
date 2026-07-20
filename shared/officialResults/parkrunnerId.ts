export const PARKRUNNER_ID_PREFIX = 'A'
export const PARKRUNNER_ID_DIGIT_COUNT = 7

export function parseParkrunnerIdDigits(value: string): string {
  return value.trim().replace(/^A/i, '').replace(/\D/g, '').slice(0, PARKRUNNER_ID_DIGIT_COUNT)
}

export function formatParkrunnerId(digits: string): string {
  const parsed = parseParkrunnerIdDigits(digits)
  if (!parsed) return ''
  return `${PARKRUNNER_ID_PREFIX}${parsed}`
}

export function isCompleteParkrunnerId(value: string): boolean {
  return parseParkrunnerIdDigits(value).length === PARKRUNNER_ID_DIGIT_COUNT
}

export function parkrunnerIdForUrl(parkrunnerId: string): string {
  return parseParkrunnerIdDigits(parkrunnerId)
}
