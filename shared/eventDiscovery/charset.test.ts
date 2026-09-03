import { describe, expect, it } from 'vitest'
import { decodeBody } from './charset'

/** "25. Fränkische-Schweiz-Marathon" as planet-marathon.de sends it. */
const LATIN1 = new Uint8Array([
  0x46, 0x72, 0xe4, 0x6e, 0x6b, 0x69, 0x73, 0x63, 0x68, 0x65,
]).buffer

describe('decodeBody', () => {
  it('reads a page that only says so through its source entry', () => {
    expect(decodeBody(LATIN1, 'iso-8859-1')).toBe('Fränkische')
  })

  it('shows what reading it as UTF-8 would have cost', () => {
    expect(decodeBody(LATIN1)).toContain('�')
  })

  it('falls back to UTF-8 rather than taking the run down', () => {
    expect(decodeBody(new TextEncoder().encode('Åre').buffer, 'not-a-charset')).toBe('Åre')
  })
})
