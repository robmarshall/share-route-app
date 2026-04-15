import length from '@turf/length';
import { lineString } from '@turf/helpers';
import type { Point } from '../state/routeStore';

export function dayDistanceKm(points: Point[]): number {
  if (points.length < 2) return 0;
  const line = lineString(points.map(([lat, lng]) => [lng, lat]));
  return length(line, { units: 'kilometers' });
}
