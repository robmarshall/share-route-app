import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import type { Day, Mode, Point } from '../state/routeStore';
import { colorForDay } from '../lib/colors';
import 'leaflet/dist/leaflet.css';

export type Basemap = 'street' | 'satellite';

type Props = {
  days: Day[];
  activeDayIndex: number;
  mode: Mode;
  basemap: Basemap;
  flyTo: { center: Point; zoom: number } | null;
  fitBounds: Point[] | null;
  onAddPoint: (p: Point) => void;
  onMovePoint: (dayIndex: number, pointIndex: number, p: Point) => void;
  onDeletePoint: (dayIndex: number, pointIndex: number) => void;
};

function FlyToHandler({ target }: { target: Props['flyTo'] }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function FitBoundsHandler({ points }: { points: Point[] | null }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length >= 2) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points && points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [points, map]);
  return null;
}

function ClickHandler({ mode, onAdd }: { mode: Mode; onAdd: (p: Point) => void }) {
  useMapEvents({
    click(e) {
      if (mode === 'add') onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function MapView({ days, activeDayIndex, mode, basemap, flyTo, fitBounds, onAddPoint, onMovePoint, onDeletePoint }: Props) {
  return (
    <MapContainer center={[51.5074, -0.1278]} zoom={11} style={{ height: '100%', width: '100%' }}>
      {basemap === 'street' ? (
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      ) : (
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      )}
      <FlyToHandler target={flyTo} />
      <FitBoundsHandler points={fitBounds} />
      <ClickHandler mode={mode} onAdd={onAddPoint} />
      {days.map((d, di) => (
        <Polyline
          key={`line-${di}`}
          positions={d.points}
          pathOptions={{
            color: colorForDay(di),
            weight: di === activeDayIndex ? 5 : 3,
            opacity: di === activeDayIndex ? 1 : 0.6,
          }}
        />
      ))}
      {days[activeDayIndex]?.points.map((p, pi) => (
        <CircleMarker
          key={`m-${activeDayIndex}-${pi}`}
          center={p}
          radius={6}
          pathOptions={{ color: colorForDay(activeDayIndex), fillColor: '#fff', fillOpacity: 1, weight: 2 }}
          eventHandlers={{
            click(e) {
              if (mode === 'delete') {
                e.originalEvent.stopPropagation();
                onDeletePoint(activeDayIndex, pi);
              }
            },
            mousedown(e) {
              if (mode !== 'edit') return;
              const map = e.target._map;
              map.dragging.disable();
              const move = (ev: any) => {
                onMovePoint(activeDayIndex, pi, [ev.latlng.lat, ev.latlng.lng]);
              };
              const up = () => {
                map.off('mousemove', move);
                map.off('mouseup', up);
                map.dragging.enable();
              };
              map.on('mousemove', move);
              map.on('mouseup', up);
            },
          }}
        />
      ))}
    </MapContainer>
  );
}
