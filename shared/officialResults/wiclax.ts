import { splitFullName } from './matchName.js'

export const WICLAX_POWERED_PATTERN = /Powered by Wiclax|wiclax\.com/i
export const WICLAX_PAGE_URLEPR_PATTERN = /URLEpr\s*=\s*["']([^"']+\.clax)["']/i
export const WICLAX_CLAX_URL_PATTERN = /https?:\/\/[^\s"'<>]+\.clax/i

export type WiclaxUrlParts = {
  pageUrl: string
  claxUrl?: string
}

export type WiclaxEngaged = {
  bib: string
  fullName: string
  firstName: string
  lastName: string
  course: string
}

export type WiclaxResult = {
  bib: string
  time: string
  timeSeconds: number
}

export type WiclaxRanking = {
  position: number
  totalParticipants: number
  course: string
}

export type WiclaxMatch = {
  engaged: WiclaxEngaged
  result: WiclaxResult
  ranking: WiclaxRanking
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function normalizeWiclaxName(value: string): string {
  return decodeXmlEntities(value).replace(/\u00a0/g, ' ').trim()
}

export function parseWiclaxTime(value: string): string | null {
  const match = /^(\d+)h(\d+)'(\d+)$/.exec(value.trim())
  if (!match) return null

  return `${match[1]!.padStart(2, '0')}:${match[2]}:${match[3]}`
}

export function parseWiclaxTimeSeconds(value: string): number | null {
  const match = /^(\d+)h(\d+)'(\d+)$/.exec(value.trim())
  if (!match) return null

  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

export function isWiclaxResultsPage(html: string): boolean {
  return WICLAX_POWERED_PATTERN.test(html) || WICLAX_PAGE_URLEPR_PATTERN.test(html)
}

export function parseWiclaxClaxUrlFromHtml(html: string): string | null {
  const fromVariable = WICLAX_PAGE_URLEPR_PATTERN.exec(html)
  if (fromVariable?.[1]) return fromVariable[1]

  const fromLink = WICLAX_CLAX_URL_PATTERN.exec(html)
  return fromLink?.[0] ?? null
}

export function isWiclaxResultsPath(pathname: string): boolean {
  return /classificacoes-em-direto/i.test(pathname) || /\/wiclax\//i.test(pathname)
}

export function parseWiclaxUrl(url: string): WiclaxUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (/\.clax$/i.test(parsed.pathname)) {
      return { pageUrl: parsed.toString(), claxUrl: parsed.toString() }
    }

    if (isWiclaxResultsPath(parsed.pathname)) {
      return { pageUrl: parsed.toString() }
    }
  } catch {
    return null
  }

  return null
}

export function parseWiclaxEngaged(xml: string): WiclaxEngaged[] {
  const engaged: WiclaxEngaged[] = []

  for (const match of xml.matchAll(/<E\s+([^>]*?)\/>/g)) {
    const attrs = match[1] ?? ''
    const bib = /d="([^"]+)"/.exec(attrs)?.[1]
    const fullName = normalizeWiclaxName(/n="([^"]*)"/.exec(attrs)?.[1] ?? '')
    const course = decodeXmlEntities(/p="([^"]*)"/.exec(attrs)?.[1] ?? '').trim()
    if (!bib || !fullName) continue

    const { first, last } = splitFullName(fullName)
    if (!last) continue

    engaged.push({
      bib,
      fullName,
      firstName: first,
      lastName: last,
      course,
    })
  }

  return engaged
}

export function parseWiclaxResults(xml: string): Map<string, WiclaxResult> {
  const results = new Map<string, WiclaxResult>()
  const resultats = /<Resultats>([\s\S]*?)<\/Resultats>/i.exec(xml)?.[1] ?? xml

  for (const match of resultats.matchAll(/<R\s+([^>]*?)\/>/g)) {
    const attrs = match[1] ?? ''
    const bib = /d="([^"]+)"/.exec(attrs)?.[1]
    const rawTime = /t="([^"]+)"/.exec(attrs)?.[1]
    if (!bib || !rawTime) continue

    const time = parseWiclaxTime(rawTime)
    const timeSeconds = parseWiclaxTimeSeconds(rawTime)
    if (!time || timeSeconds == null) continue

    results.set(bib, { bib, time, timeSeconds })
  }

  return results
}

export function buildWiclaxRankings(
  engaged: WiclaxEngaged[],
  results: Map<string, WiclaxResult>,
): Map<string, WiclaxRanking> {
  const byCourse = new Map<string, Array<{ bib: string; timeSeconds: number }>>()

  for (const entry of engaged) {
    const result = results.get(entry.bib)
    if (!result) continue

    const list = byCourse.get(entry.course) ?? []
    list.push({ bib: entry.bib, timeSeconds: result.timeSeconds })
    byCourse.set(entry.course, list)
  }

  const rankings = new Map<string, WiclaxRanking>()

  for (const [course, list] of byCourse) {
    list.sort((left, right) => left.timeSeconds - right.timeSeconds)
    list.forEach((entry, index) => {
      rankings.set(entry.bib, {
        position: index + 1,
        totalParticipants: list.length,
        course,
      })
    })
  }

  return rankings
}

export function findWiclaxMatches(xml: string): WiclaxMatch[] {
  const engaged = parseWiclaxEngaged(xml)
  const results = parseWiclaxResults(xml)
  const rankings = buildWiclaxRankings(engaged, results)

  const matches: WiclaxMatch[] = []
  for (const entry of engaged) {
    const result = results.get(entry.bib)
    const ranking = rankings.get(entry.bib)
    if (!result || !ranking) continue

    matches.push({ engaged: entry, result, ranking })
  }

  return matches
}
