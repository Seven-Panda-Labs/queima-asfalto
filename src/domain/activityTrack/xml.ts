/**
 * Both exporters repeat `xmlns` on nearly every element, and some write prefixed
 * names, so tag lookups match on local name rather than on the qualified name.
 *
 * The wildcard namespace form is what makes this affordable. Filtering
 * `getElementsByTagName('*')` by `localName` reads the same but walks a live
 * collection per index: on the 22k element sample TCX that is 51 seconds against 42 ms.
 */
export function descendantsByLocalName(root: Element | Document, name: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', name))
}

export function firstDescendantByLocalName(root: Element, name: string): Element | null {
  return root.getElementsByTagNameNS('*', name)[0] ?? null
}

export function textByLocalName(root: Element, name: string): string | undefined {
  const text = firstDescendantByLocalName(root, name)?.textContent?.trim()
  return text ? text : undefined
}

export function numberByLocalName(root: Element, name: string): number | undefined {
  const text = textByLocalName(root, name)
  if (text === undefined) return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

export function parseNumericAttribute(element: Element, name: string): number | undefined {
  const raw = element.getAttribute(name)
  if (raw === null) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

export function parseTimestamp(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const value = Date.parse(raw)
  return Number.isNaN(value) ? undefined : value
}

/** `DOMParser` reports malformed XML through a `parsererror` node instead of throwing. */
export function parseXmlDocument(xml: string): Document | null {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.getElementsByTagName('parsererror').length > 0) return null
  if (!document.documentElement) return null
  return document
}

/**
 * Direct children only. A TCX `<Lap>` contains the whole `<Track>`, so a descendant
 * search for `Time` or `Value` inside a lap would pick up a trackpoint's value.
 */
export function childByLocalName(parent: Element, name: string): Element | null {
  for (const child of parent.children) {
    if (child.localName === name) return child
  }
  return null
}

export function childNumber(parent: Element, name: string): number | undefined {
  const text = childByLocalName(parent, name)?.textContent?.trim()
  if (!text) return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

/** Reads the `<Value>` wrapper TCX puts around heart rate readings. */
export function childWrappedValue(parent: Element, name: string): number | undefined {
  const wrapper = childByLocalName(parent, name)
  if (!wrapper) return undefined
  return childNumber(wrapper, 'Value')
}
