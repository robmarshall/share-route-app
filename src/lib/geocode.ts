import type { Point } from '../state/routeStore';

export type GeocodeResult = { center: Point; zoom: number; label: string };

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'gb');
  const res = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) return null;
  const hit = data[0];
  return {
    center: [parseFloat(hit.lat), parseFloat(hit.lon)],
    zoom: 15,
    label: hit.display_name,
  };
}
