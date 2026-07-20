export function pickRandomLine(lines: string[], seed?: number): string {
  if (lines.length === 0) return ''
  if (lines.length === 1) return lines[0]!
  const index =
    seed !== undefined
      ? Math.abs(seed) % lines.length
      : Math.floor(Math.random() * lines.length)
  return lines[index]!
}
