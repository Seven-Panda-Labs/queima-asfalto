import i18n from '../i18n'

export type Classification = {
  position: number
  total: number
}

const SLASH_PATTERN = /^(\d+)\s*\/\s*(\d+)$/
const DE_PATTERN = /^(\d+)\s+de\s+(\d+)$/i
const OF_PATTERN = /^(\d+)\s+of\s+(\d+)$/i

export function parseClassification(input: string): Classification | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const slashMatch = SLASH_PATTERN.exec(trimmed)
  if (slashMatch) {
    return toClassification(slashMatch[1], slashMatch[2])
  }

  const deMatch = DE_PATTERN.exec(trimmed)
  if (deMatch) {
    return toClassification(deMatch[1], deMatch[2])
  }

  const ofMatch = OF_PATTERN.exec(trimmed)
  if (ofMatch) {
    return toClassification(ofMatch[1], ofMatch[2])
  }

  return null
}

function toClassification(positionRaw: string, totalRaw: string): Classification | null {
  const position = Number(positionRaw)
  const total = Number(totalRaw)

  if (!Number.isInteger(position) || !Number.isInteger(total) || position <= 0 || total <= 0) {
    return null
  }

  return { position, total }
}

export function formatClassification(position: number, total: number): string {
  return `${position}/${total}`
}

export function formatClassificationDisplay(stored?: string | null): string {
  if (!stored?.trim()) return '—'
  const firstLine = stored.split('\n')[0]?.replace(/^\d+\.\s*/, '').trim() ?? ''
  const parsed = parseClassification(firstLine)
  if (!parsed) return stored
  return i18n.t('classification.display', {
    position: parsed.position,
    total: parsed.total,
  })
}

export function parseMultiLineClassification(input: string): Classification[] {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .map(parseClassification)
    .filter((item): item is Classification => item !== null)
}

export function validateClassification(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return true

  if (trimmed.includes('\n')) {
    const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)
    return lines.length > 0 && lines.every((line) => parseClassification(line.replace(/^\d+\.\s*/, '')) !== null)
  }

  return parseClassification(trimmed) !== null
}

export function getInvalidClassificationMessage(): string {
  return i18n.t('classification.invalid')
}

/** @deprecated Use getInvalidClassificationMessage() */
export const INVALID_CLASSIFICATION_MESSAGE =
  'Classificação inválida. Usa posição/total ou X de Y'
