import polyline from '@mapbox/polyline';
import simplify from 'simplify-js';
import type { Day, Point } from '../state/routeStore';

const SIMPLIFY_TOLERANCE = 0.0001;

function simplifyPoints(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const objs = points.map(([lat, lng]) => ({ x: lat, y: lng }));
  const out = simplify(objs, SIMPLIFY_TOLERANCE, true);
  return out.map((p) => [p.x, p.y] as Point);
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzip(input: string): Promise<Uint8Array> {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

async function gunzip(input: Uint8Array): Promise<string> {
  const buf = input.slice().buffer;
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

// Polyline-encoded strings use ASCII 63..126, which includes `~` and `|`.
// Use control chars outside that range as separators. Day names are
// passed through encodeURIComponent which encodes `\n` and `\t`, so they
// can never collide with the separators.
const DAY_SEP = '\n';
const FIELD_SEP = '\t';

export async function encodeRoute(days: Day[]): Promise<string> {
  const payload = days
    .map((d) => {
      const simplified = simplifyPoints(d.points);
      const encoded = polyline.encode(simplified);
      const name = encodeURIComponent(d.name);
      return `${name}${FIELD_SEP}${encoded}`;
    })
    .join(DAY_SEP);
  const gz = await gzip(payload);
  return base64urlEncode(gz);
}

export async function decodeRoute(hash: string): Promise<Day[]> {
  if (!hash) return [];
  try {
    const bytes = base64urlDecode(hash);
    const payload = await gunzip(bytes);
    if (!payload) return [];
    return payload.split(DAY_SEP).map((seg) => {
      const [name, encoded] = seg.split(FIELD_SEP);
      const points = encoded
        ? (polyline.decode(encoded) as Point[])
        : [];
      return { name: decodeURIComponent(name || 'Day'), points };
    });
  } catch (e) {
    console.error('decode failed', e);
    return [];
  }
}
