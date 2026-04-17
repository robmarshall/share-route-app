import simplify from 'simplify-js';
import type { Point } from '../state/routeStore';

export type SnapResult =
  | { ok: true; points: Point[] }
  | { ok: false; reason: 'no-road' | 'network' };

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export const SNAP_RADIUS_M = 50;
const SIMPLIFY_TOLERANCE_DEG = 0.00015;

export async function snapRoute(
  from: Point,
  to: Point,
  radiusMeters: number = SNAP_RADIUS_M,
): Promise<SnapResult> {
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = new URL(`${OSRM_BASE}/${coords}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('radiuses', `${radiusMeters};${radiusMeters}`);

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'network' };
  const data = (await res.json()) as {
    code: string;
    routes?: Array<{ geometry: { coordinates: [number, number][] } }>;
  };
  if (data.code === 'NoSegment' || data.code === 'NoRoute') {
    return { ok: false, reason: 'no-road' };
  }
  if (data.code !== 'Ok' || !data.routes?.length) {
    return { ok: false, reason: 'no-road' };
  }
  const planar = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
    x: lng,
    y: lat,
  }));
  const simplified = simplify(planar, SIMPLIFY_TOLERANCE_DEG, true);
  const points: Point[] = simplified.map(({ x, y }) => [y, x] as Point);
  return { ok: true, points };
}
