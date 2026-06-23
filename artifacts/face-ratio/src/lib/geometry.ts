export interface Point {
  x: number;
  y: number;
}

export function dist(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Angle in degrees between two vectors from a shared origin
export function angleBetweenVectors(
  v1x: number, v1y: number,
  v2x: number, v2y: number,
): number {
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cos) * (180 / Math.PI);
}

// Canthal tilt: positive = outer corner higher than inner (in image coords y-down)
export function canthalTilt(medial: Point, lateral: Point): number {
  const dx = Math.abs(lateral.x - medial.x);
  const dy = medial.y - lateral.y; // positive if lateral has smaller y (is higher)
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

// Vertical distance (y difference, positive = lower point minus upper point)
export function verticalDist(upper: Point, lower: Point): number {
  return lower.y - upper.y;
}

// Horizontal distance (absolute x difference)
export function horizontalDist(a: Point, b: Point): number {
  return Math.abs(b.x - a.x);
}
