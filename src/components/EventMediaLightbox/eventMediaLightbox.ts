export function stepMediaIndex(
  current: number,
  delta: number,
  length: number,
): number {
  if (length <= 0) return 0
  const next = current + delta
  if (next < 0) return 0
  if (next >= length) return length - 1
  return next
}

export type SwipeDirection = 'previous' | 'next'

export function swipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = 50,
): SwipeDirection | null {
  const deltaX = endX - startX
  const deltaY = endY - startY

  if (Math.abs(deltaX) < threshold) return null
  if (Math.abs(deltaX) <= Math.abs(deltaY)) return null

  return deltaX > 0 ? 'previous' : 'next'
}
