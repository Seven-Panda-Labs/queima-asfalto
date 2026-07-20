import { EMOJI_OPTIONS } from '../constants/emojis'

export type EventEmojiInput = {
  name: string
  date: Date
  location?: string
}

const PARKRUN_PATTERN = /park\s*run/i
const MARATHON_PATTERN = /marat[oó]na|marathon|meia\s*marat|half\s*marathon|21[,.]1\s*km?/i
const NATURE_PATTERN =
  /trail|wald|forest|floresta|parque|montanha|mountain|berg|nature|hasenheide|grunewald/i

const SUMMER_MONTHS = new Set([5, 6, 7])
const WINTER_MONTHS = new Set([11, 0, 1])

type EmojiRule = {
  id: string
  emoji: string
  matches: (input: EventEmojiInput) => boolean
}

const EMOJI_RULES: EmojiRule[] = [
  {
    id: 'parkrun',
    emoji: '🌳',
    matches: ({ name }) => PARKRUN_PATTERN.test(name),
  },
  {
    id: 'marathon',
    emoji: '🏅',
    matches: ({ name }) => MARATHON_PATTERN.test(name),
  },
  {
    id: 'nature',
    emoji: '🏞️',
    matches: ({ name, location = '' }) =>
      NATURE_PATTERN.test(name) || NATURE_PATTERN.test(location),
  },
  {
    id: 'summer',
    emoji: '☀️',
    matches: ({ date }) => SUMMER_MONTHS.has(date.getMonth()),
  },
  {
    id: 'winter',
    emoji: '❄️',
    matches: ({ date }) => WINTER_MONTHS.has(date.getMonth()),
  },
]

function hashSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

export function pickRandomEventEmoji(seed: string): string {
  const normalized = seed.trim().toLowerCase() || 'default'
  const index = hashSeed(normalized) % EMOJI_OPTIONS.length
  return EMOJI_OPTIONS[index]!.emoji
}

export function suggestEventEmoji(input: EventEmojiInput): string {
  for (const rule of EMOJI_RULES) {
    if (rule.matches(input)) return rule.emoji
  }

  const seed = `${input.name.trim().toLowerCase()}|${input.date.toISOString().slice(0, 10)}`
  return pickRandomEventEmoji(seed)
}

export { EMOJI_RULES }
