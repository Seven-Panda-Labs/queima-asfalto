import { decodeBody } from '../shared/eventDiscovery/charset.js'

const FETCH_TIMEOUT_MS = 20_000

/**
 * One request, identified and slow on purpose.
 *
 * A harvest is a machine reading a site nobody asked to be read, so it says who
 * it is and where to complain, and it waits between pages. The delay is the
 * whole politeness budget: the schedule runs once a week with one instance, so
 * nothing else throttles this.
 */
export const USER_AGENT =
  'queima-asfalto-discovery/1.0 (+https://github.com/Seven-Panda-Labs/queima-asfalto)'

export const DELAY_BETWEEN_PAGES_MS = 700

/**
 * @param charset what the page is, for a source whose server does not say.
 */
export async function fetchPage(url: string, charset?: string): Promise<string | null> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': USER_AGENT },
  })

  // A page that is gone, moved or refused is not an error worth failing the run
  // for: a past event redirects to its results, and the sitemap lists it forever.
  if (!response.ok) return null

  return decodeBody(await response.arrayBuffer(), charset)
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
