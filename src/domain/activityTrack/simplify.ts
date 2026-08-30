export type RoutePoint = { lat: number; lon: number }

const EARTH_RADIUS_METERS = 6371000

/**
 * Equirectangular projection around the route's own latitude. Over a race sized
 * bounding box the distortion is far below the GPS noise we are smoothing away.
 */
function project(points: RoutePoint[]): Array<{ x: number; y: number }> {
  const meanLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length
  const cosLat = Math.cos((meanLat * Math.PI) / 180)
  return points.map((point) => ({
    x: (point.lon * Math.PI * EARTH_RADIUS_METERS * cosLat) / 180,
    y: (point.lat * Math.PI * EARTH_RADIUS_METERS) / 180,
  }))
}

function perpendicularDistance(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y)

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  const clamped = Math.max(0, Math.min(1, t))
  return Math.hypot(point.x - (start.x + clamped * dx), point.y - (start.y + clamped * dy))
}

/** Iterative Douglas-Peucker: a race track is long enough to blow a recursive stack. */
function keepMask(projected: Array<{ x: number; y: number }>, tolerance: number): boolean[] {
  const keep = new Array<boolean>(projected.length).fill(false)
  keep[0] = true
  keep[projected.length - 1] = true

  const stack: Array<[number, number]> = [[0, projected.length - 1]]
  while (stack.length > 0) {
    const [first, last] = stack.pop()!
    let farthest = -1
    let maxDistance = tolerance

    for (let index = first + 1; index < last; index++) {
      const distance = perpendicularDistance(projected[index], projected[first], projected[last])
      if (distance > maxDistance) {
        maxDistance = distance
        farthest = index
      }
    }

    if (farthest !== -1) {
      keep[farthest] = true
      stack.push([first, farthest], [farthest, last])
    }
  }

  return keep
}

/**
 * Simplifies to a point budget rather than a fixed tolerance, so a 5 km and a
 * marathon route cost the same to store in Firestore.
 */
export function simplifyRoute(points: RoutePoint[], budget: number): RoutePoint[] {
  if (points.length <= budget) return points

  const projected = project(points)
  let tolerance = 1
  for (let attempt = 0; attempt < 24; attempt++) {
    const keep = keepMask(projected, tolerance)
    const kept = points.filter((_, index) => keep[index])
    if (kept.length <= budget) return kept
    tolerance *= 2
  }

  return points.slice(0, budget)
}
