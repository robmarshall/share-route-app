import type { Day } from '../state/routeStore';
import { colorForDay } from '../lib/colors';
import { dayDistanceKm } from '../lib/distance';

type Props = {
  days: Day[];
  activeDayIndex: number;
  setActive: (i: number) => void;
  renameDay: (i: number, name: string) => void;
  deleteDay: (i: number) => void;
};

export function DaySidebar({ days, activeDayIndex, setActive, renameDay, deleteDay }: Props) {
  return (
    <div className="sidebar">
      <h3>Days</h3>
      {days.map((d, i) => {
        const km = dayDistanceKm(d.points);
        const active = i === activeDayIndex;
        return (
          <div
            key={i}
            className={`day-row ${active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <span className="swatch" style={{ background: colorForDay(i) }} />
            <input
              value={d.name}
              onChange={(e) => renameDay(i, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="km">{km.toFixed(2)} km</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteDay(i);
              }}
              title="Delete day"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
