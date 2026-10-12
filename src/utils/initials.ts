/**
 * Up to two letters for an avatar: first and last word of a name, or the parts
 * of an email's local part when there is no name (`m.galli@…` gives MG).
 */
export function initials(label: string): string {
  const source = label.includes('@') ? label.split('@')[0] : label
  const words = source.split(/[\s._-]+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = Array.from(words[0])[0]
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : ''
  return (first + last).toLocaleUpperCase()
}
