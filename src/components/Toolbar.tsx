import { useState } from 'react';
import type { Mode } from '../state/routeStore';
import type { Basemap } from './MapView';
import { geocode } from '../lib/geocode';
import type { GeocodeResult } from '../lib/geocode';

type Props = {
  mode: Mode;
  setMode: (m: Mode) => void;
  basemap: Basemap;
  setBasemap: (b: Basemap) => void;
  onAddDay: () => void;
  onGeocoded: (r: GeocodeResult) => void;
  urlSize: number;
  totalKm: number;
};

export function Toolbar({ mode, setMode, basemap, setBasemap, onAddDay, onGeocoded, urlSize, totalKm }: Props) {
  const modes: Mode[] = ['add', 'edit', 'delete'];
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'notfound'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setStatus('loading');
    const result = await geocode(query);
    if (!result) {
      setStatus('notfound');
      return;
    }
    setStatus('idle');
    onGeocoded(result);
  }

  return (
    <div className="toolbar">
      <button onClick={onAddDay}>+ Add Day</button>
      <div className="mode-group">
        {modes.map((m) => (
          <button
            key={m}
            className={mode === m ? 'active' : ''}
            onClick={() => setMode(m)}
          >
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
      <div className="mode-group">
        <button
          className={basemap === 'street' ? 'active' : ''}
          onClick={() => setBasemap('street')}
        >
          Map
        </button>
        <button
          className={basemap === 'satellite' ? 'active' : ''}
          onClick={() => setBasemap('satellite')}
        >
          Satellite
        </button>
      </div>
      <form className="search" onSubmit={submit}>
        <input
          placeholder="Postcode or place (UK)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (status === 'notfound') setStatus('idle');
          }}
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : 'Go'}
        </button>
        {status === 'notfound' && <span className="notfound">not found</span>}
      </form>
      <div className="stats">
        <span>URL: {(urlSize / 1024).toFixed(2)} KB</span>
        <span>Total: {totalKm.toFixed(2)} km</span>
      </div>
    </div>
  );
}
