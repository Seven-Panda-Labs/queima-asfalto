/**
 * Bytes into text, for a page that does not say what it is.
 *
 * `Response.text()` decodes as UTF-8 whenever the server sends no charset, and
 * planet-marathon.de sends none: its Content-Type is a bare `text/html` and the
 * markup has no meta charset either, while the bytes are ISO-8859-1. Read as
 * UTF-8, every German umlaut becomes a replacement character, and "Fränkische"
 * lands in the catalog as "Fr�nkische" forever.
 *
 * So the source says what its pages are, and this decodes them. An unknown
 * label falls back to UTF-8 rather than throwing: a source with a typo in its
 * charset should degrade, not take the run down.
 */
export function decodeBody(body: ArrayBuffer, charset?: string): string {
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(body)
  } catch {
    return new TextDecoder('utf-8').decode(body)
  }
}
