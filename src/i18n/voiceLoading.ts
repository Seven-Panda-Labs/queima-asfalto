import type { TFunction } from 'i18next'
import { pickRandomLine } from '../utils/pickVoiceLine'

export type SharedVoiceSection = 'events' | 'results' | 'goals' | 'bucketList' | 'generic'

function readLinePool(t: TFunction, key: string): string[] {
  const value = t(key, { returnObjects: true })
  if (!Array.isArray(value)) return []
  return value.filter((line): line is string => typeof line === 'string' && line.length > 0)
}

function interpolateName(line: string, ownerName: string): string {
  return line.replace(/\{\{name\}\}/g, ownerName)
}

export function pickSharedVoiceLines(
  t: TFunction,
  section: SharedVoiceSection,
  ownerName: string,
  seed?: number,
): { primary: string; secondary: string; aria: string } {
  const primaryPool = readLinePool(t, `voice.loading.shared.${section}.primary`)
  const secondaryPool = readLinePool(t, `voice.loading.shared.${section}.secondary`)
  const genericPrimary = readLinePool(t, 'voice.loading.shared.generic.primary')
  const genericSecondary = readLinePool(t, 'voice.loading.shared.generic.secondary')

  const primary = interpolateName(
    pickRandomLine(primaryPool.length > 0 ? primaryPool : genericPrimary, seed),
    ownerName,
  )
  const secondary = interpolateName(
    pickRandomLine(
      secondaryPool.length > 0 ? secondaryPool : genericSecondary,
      seed !== undefined ? seed + 1 : undefined,
    ),
    ownerName,
  )

  return {
    primary,
    secondary,
    aria: t('voice.loading.shared.aria', { name: ownerName }),
  }
}
