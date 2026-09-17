/**
 * Reads a results PDF into text, in the browser, and never sends it anywhere.
 *
 * A field's ranking carries every finisher's name. The file stays on the
 * reader's machine: pdfjs is pulled in only when somebody actually picks a PDF,
 * which also keeps it out of the main bundle.
 */

type TextItem = {
  str?: string
  width?: number
  transform?: number[]
}

/** Two items on one printed line sit within a point of each other. */
const COLUMN_GAP_POINTS = 1

/**
 * Rebuilds printed lines from the pieces a PDF is really made of.
 *
 * Joining everything with a space would break a time split across two items;
 * joining with nothing would weld two columns together. So a space goes in only
 * where the page actually left a gap. The operator's own name column is fixed
 * width, and a long name runs into the time with no gap at all, which is why the
 * row parser tolerates the two touching.
 */
export function itemsToLines(items: TextItem[]): string[] {
  const byLine = new Map<number, TextItem[]>()

  for (const item of items) {
    if (typeof item.str !== 'string' || !item.transform) continue
    const y = Math.round(item.transform[5] ?? 0)
    const line = byLine.get(y)
    if (line) line.push(item)
    else byLine.set(y, [item])
  }

  const lines: string[] = []

  for (const y of [...byLine.keys()].sort((left, right) => right - left)) {
    const row = [...(byLine.get(y) ?? [])].sort(
      (left, right) => (left.transform?.[4] ?? 0) - (right.transform?.[4] ?? 0),
    )

    let text = ''
    let previousEnd: number | null = null

    for (const item of row) {
      const start = item.transform?.[4] ?? 0
      if (previousEnd !== null && start - previousEnd > COLUMN_GAP_POINTS) text += ' '
      text += item.str ?? ''
      previousEnd = start + (item.width ?? 0)
    }

    if (text.trim()) lines.push(text.trim())
  }

  return lines
}

export async function extractPdfText(file: File): Promise<string> {
  const [pdfjs, workerSrc] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url').then((module) => module.default),
  ])

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })

  try {
    const document = await task.promise
    const lines: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      lines.push(...itemsToLines(content.items as TextItem[]))
    }
    return lines.join('\n')
  } finally {
    // Frees the worker even when a page throws part way through.
    await task.destroy()
  }
}
