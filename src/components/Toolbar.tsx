import { useState } from 'react';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Bars3Icon,
  MapIcon,
  GlobeAltIcon,
  PencilIcon,
  LinkIcon,
  HandRaisedIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
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
  onToggleSidebar: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

const MODE_BUTTONS: Array<{ mode: Mode; label: string; Icon: typeof PencilIcon }> = [
  { mode: 'freestyle', label: 'Freestyle — click to drop points', Icon: PencilIcon },
  { mode: 'snap', label: 'Snap — route between points along roads', Icon: LinkIcon },
  { mode: 'edit', label: 'Edit — drag points to move', Icon: HandRaisedIcon },
  { mode: 'delete', label: 'Delete — click a point to remove', Icon: TrashIcon },
];

export function Toolbar({
  mode,
  setMode,
  basemap,
  setBasemap,
  onAddDay,
  onGeocoded,
  urlSize,
  totalKm,
  onToggleSidebar,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
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
      <button
        className="menu-btn icon-btn"
        onClick={onToggleSidebar}
        aria-label="Show days"
        title="Days"
      >
        <Bars3Icon className="icon" />
      </button>
      <div className="mode-group">
        <button
          className="icon-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="icon" />
        </button>
        <button
          className="icon-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          <ArrowUturnRightIcon className="icon" />
        </button>
      </div>
      <button onClick={onAddDay}>+ Day</button>
      <div className="mode-group">
        {MODE_BUTTONS.map(({ mode: m, label, Icon }) => (
          <button
            key={m}
            className={`icon-btn${mode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}
            aria-label={label}
            aria-pressed={mode === m}
            title={label}
          >
            <Icon className="icon" />
          </button>
        ))}
      </div>
      <div className="mode-group">
        <button
          className={`icon-btn${basemap === 'street' ? ' active' : ''}`}
          onClick={() => setBasemap('street')}
          aria-label="Street map"
          aria-pressed={basemap === 'street'}
          title="Street map"
        >
          <MapIcon className="icon" />
        </button>
        <button
          className={`icon-btn${basemap === 'satellite' ? ' active' : ''}`}
          onClick={() => setBasemap('satellite')}
          aria-label="Satellite"
          aria-pressed={basemap === 'satellite'}
          title="Satellite"
        >
          <GlobeAltIcon className="icon" />
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
        <span className="url-size">URL: {(urlSize / 1024).toFixed(2)} KB</span>
        <span>Total: {totalKm.toFixed(2)} km</span>
      </div>
    </div>
  );
}
