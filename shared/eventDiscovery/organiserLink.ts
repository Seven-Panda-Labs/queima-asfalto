/**
 * The organiser's own site, read off the platform that listed the race.
 *
 * Nine tenths of the catalog was found on two calendars, and the entry kept
 * the calendar's page as its "official" URL because that is the page it was
 * read from. Measured: 5115 of 5585 live entries point at runme.de,
 * running.life or another listing rather than at the race.
 *
 * That costs twice. An operator checking next season's date opens the platform
 * and clicks again to leave it. And two entries for one race, found on two
 * calendars, look unrelated while both point at a calendar: the organiser's
 * site is the same on both, which is the strongest evidence a duplicate rule
 * could have and it was hidden behind the platform.
 *
 * Both platforms mark the link, so nothing here reads prose: running.life
 * carries `data-out="website"` on the anchor, and runme.de gives it
 * `class="referer-link"` with `target="webext"` and the word Website.
 */

/** Hosts that are the platform or its family, never the organiser. */
const NOT_THE_ORGANISER =
  /(?:^|\.)(?:runme\.(?:de|at|ch|us)|running\.life|walking\.life|gotrail\.run|evenager\.com|myraceland\.com|kilometerliebe\.de|planet-marathon\.de)$/i

/**
 * The attributes of every anchor on the page.
 *
 * The opening tag alone, because an anchor's contents can be anything: the
 * running.life button wraps an inline SVG of several hundred characters, and
 * reading to the closing tag missed it entirely.
 */
function anchorAttributes(html: string): string[] {
  return [...html.matchAll(/<a\b([^>]*)>/gi)].map((match) => match[1] ?? '')
}

/** Anchors with the words inside them, for the one platform that labels. */
function labelledAnchors(html: string): { attributes: string; text: string }[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]{0,400}?)<\/a>/gi)].map((match) => ({
    attributes: match[1] ?? '',
    text: (match[2] ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
  }))
}

function hrefIn(attributes: string): string | undefined {
  const match = /\bhref\s*=\s*"([^"]+)"/i.exec(attributes) ?? /\bhref\s*=\s*'([^']+)'/i.exec(attributes)
  return match?.[1]?.trim()
}

/** A link that is a site somebody could open, and is not the platform's own. */
function organiserHref(attributes: string): string | undefined {
  const href = hrefIn(attributes)
  if (!href || !/^https?:\/\//i.test(href)) return undefined
  try {
    const host = new URL(href).host.replace(/^www\./, '')
    return NOT_THE_ORGANISER.test(host) ? undefined : href
  } catch {
    return undefined
  }
}

export function readOrganiserLink(html: string): string | undefined {
  // running.life says which link is which, on the anchor itself.
  for (const attributes of anchorAttributes(html)) {
    if (!/\bdata-out\s*=\s*["']website["']/i.test(attributes)) continue
    const href = organiserHref(attributes)
    if (href) return href
  }

  // runme.de marks it as an outbound referer and labels it Website. The label
  // matters: the same page links the publisher (evenager) the same way.
  for (const anchor of labelledAnchors(html)) {
    const marked =
      /\bclass\s*=\s*["'][^"']*referer-link/i.test(anchor.attributes) ||
      /\btarget\s*=\s*["']webext["']/i.test(anchor.attributes)
    if (!marked || !/^(?:website|webseite|web|homepage)$/i.test(anchor.text)) continue
    const href = organiserHref(anchor.attributes)
    if (href) return href
  }

  return undefined
}
