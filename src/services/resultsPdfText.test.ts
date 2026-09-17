import { describe, expect, it } from 'vitest'
import { itemsToLines } from './resultsPdfText'

/** `transform` is a PDF text matrix; only x (index 4) and y (index 5) matter here. */
function item(str: string, x: number, y: number, width = str.length * 4) {
  return { str, width, transform: [1, 0, 0, 1, x, y] }
}

describe('itemsToLines', () => {
  it('groups items printed at the same height into one line', () => {
    expect(itemsToLines([item('Bernd', 40, 700), item('1.', 10, 700)])).toEqual(['1. Bernd'])
  })

  it('reads the page downwards', () => {
    expect(itemsToLines([item('second', 10, 680), item('first', 10, 700)])).toEqual([
      'first',
      'second',
    ])
  })

  it('separates columns that the page left a gap between', () => {
    const line = itemsToLines([item('Graumann', 10, 700, 40), item('00:29:11', 90, 700)])
    expect(line).toEqual(['Graumann 00:29:11'])
  })

  it('keeps a token the PDF split in two whole', () => {
    // No gap: the second piece starts exactly where the first ends.
    const line = itemsToLines([item('00:29:', 10, 700, 30), item('11', 40, 700)])
    expect(line).toEqual(['00:29:11'])
  })

  it('leaves a long name welded to the time, as the page prints it', () => {
    const line = itemsToLines([item('Fares Othman Taha Mehanna', 10, 700, 80), item('00:21:50.9', 90, 700)])
    expect(line).toEqual(['Fares Othman Taha Mehanna00:21:50.9'])
  })

  it('drops empty lines and items with nothing to say', () => {
    expect(itemsToLines([item('   ', 10, 700), { str: undefined, transform: [1, 0, 0, 1, 0, 0] }])).toEqual([])
  })
})
