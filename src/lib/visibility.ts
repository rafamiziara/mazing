/**
 * 2D visibility polygon (shadowcasting) against maze wall segments.
 *
 * Classic angular sweep: cast three rays toward every unique segment
 * endpoint (at the exact angle and ±ε to slip past corners), intersect each
 * ray with all segments, keep the nearest hit, then sort hits by angle to
 * form the light polygon. Wall segments arrive pre-merged (collinear runs
 * collapsed), which keeps this comfortably under a millisecond per frame.
 */

export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface Point {
  x: number;
  y: number;
}

const EPS = 0.0001;

/**
 * Compute the visibility polygon from origin (ox, oy), bounded by a square
 * of half-size `radius`. Returns polygon vertices in angular order.
 */
export function visibilityPolygon(
  ox: number,
  oy: number,
  segments: Segment[],
  radius: number
): Point[] {
  // Bounding box so the polygon is always closed even in open areas.
  const bounds: Segment[] = [
    { ax: ox - radius, ay: oy - radius, bx: ox + radius, by: oy - radius },
    { ax: ox + radius, ay: oy - radius, bx: ox + radius, by: oy + radius },
    { ax: ox + radius, ay: oy + radius, bx: ox - radius, by: oy + radius },
    { ax: ox - radius, ay: oy + radius, bx: ox - radius, by: oy - radius },
  ];
  const segs = segments.concat(bounds);

  // Unique endpoint angles.
  const angles: number[] = [];
  const seen = new Set<number>();
  const addAngle = (x: number, y: number) => {
    const a = Math.atan2(y - oy, x - ox);
    // Quantize for dedup; collisions at this precision are harmless.
    const key = Math.round(a * 1e6);
    if (!seen.has(key)) {
      seen.add(key);
      angles.push(a - EPS, a, a + EPS);
    }
  };
  for (const s of segs) {
    addAngle(s.ax, s.ay);
    addAngle(s.bx, s.by);
  }

  const points: { x: number; y: number; a: number }[] = [];
  for (const a of angles) {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let minT = Infinity;
    for (const s of segs) {
      const t = raySegment(ox, oy, dx, dy, s);
      if (t !== null && t < minT) minT = t;
    }
    if (minT !== Infinity) {
      points.push({ x: ox + dx * minT, y: oy + dy * minT, a });
    }
  }
  points.sort((p, q) => p.a - q.a);
  return points;
}

/**
 * Ray (o + t*d, t>=0) vs segment. Returns t of the hit or null.
 */
function raySegment(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  s: Segment
): number | null {
  const sx = s.bx - s.ax;
  const sy = s.by - s.ay;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-12) return null; // parallel
  const t = ((s.ax - ox) * sy - (s.ay - oy) * sx) / denom;
  const u = ((s.ax - ox) * dy - (s.ay - oy) * dx) / denom;
  if (t >= 0 && u >= -1e-9 && u <= 1 + 1e-9) return t;
  return null;
}

/** Point-in-polygon (ray casting). Polygon comes from visibilityPolygon. */
export function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
