/** How much of a party the marks earned. */
export type CelebrationIntensity = 'full' | 'light'

const COLORS = ['#f97316', '#2563eb', '#10b981', '#fbbf24']

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/**
 * Confetti, and only for somebody who wants movement.
 *
 * Loaded on demand: the library is dead weight on every page that never throws
 * a party, which is most of them. Anything it throws is swallowed, because a
 * browser that cannot paint confetti still has a race worth celebrating.
 */
export async function fireConfetti(intensity: CelebrationIntensity): Promise<void> {
  if (prefersReducedMotion()) return

  try {
    const { default: confetti } = await import('canvas-confetti')

    const burst = (options: Parameters<typeof confetti>[0]) => {
      try {
        void confetti(options)
      } catch {
        // Nothing to recover: the panel is the part that matters.
      }
    }

    if (intensity === 'light') {
      burst({
        particleCount: 60,
        spread: 60,
        startVelocity: 35,
        origin: { y: 0.3 },
        colors: COLORS,
      })
      return
    }

    burst({ particleCount: 120, spread: 70, origin: { y: 0.3 }, colors: COLORS })
    // Two more from the corners, a beat later: one burst reads as a glitch,
    // three read as a finish line.
    window.setTimeout(() => {
      burst({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: COLORS })
      burst({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: COLORS })
    }, 220)
  } catch {
    // The library failed to load. The celebration is still on the page.
  }
}
