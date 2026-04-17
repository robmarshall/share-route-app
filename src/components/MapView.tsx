import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { Fragment, useEffect } from 'react';
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
  selectedPointIndex: number | null;
  onAddPoint: (p: Point) => void;
  onSnapClick: (p: Point) => void;
  onMovePoint: (dayIndex: number, pointIndex: number, p: Point) => void;
  onDeletePoint: (dayIndex: number, pointIndex: number) => void;
  onSelectPoint: (pointIndex: number) => void;
  onBackgroundClick: () => void;
  onBeginDrag: () => void;
  onCommitDrag: () => void;
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

function ClickHandler({
  mode,
  onAdd,
  onSnap,
  onBackgroundClick,
}: {
  mode: Mode;
  onAdd: (p: Point) => void;
  onSnap: (p: Point) => void;
  onBackgroundClick: () => void;
}) {
  useMapEvents({
    click(e) {
      const p: Point = [e.latlng.lat, e.latlng.lng];
      if (mode === 'freestyle') onAdd(p);
      else if (mode === 'snap') onSnap(p);
      else onBackgroundClick();
    },
  });
  return null;
}

export function MapView({
  days,
  activeDayIndex,
  mode,
  basemap,
  flyTo,
  fitBounds,
  selectedPointIndex,
  onAddPoint,
  onSnapClick,
  onMovePoint,
  onDeletePoint,
  onSelectPoint,
  onBackgroundClick,
  onBeginDrag,
  onCommitDrag,
}: Props) {
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
      <ClickHandler
        mode={mode}
        onAdd={onAddPoint}
        onSnap={onSnapClick}
        onBackgroundClick={onBackgroundClick}
      />
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
      {days[activeDayIndex]?.points.map((p, pi) => {
        const selected = pi === selectedPointIndex;
        const color = colorForDay(activeDayIndex);
        return (
          <Fragment key={`m-${activeDayIndex}-${pi}`}>
            <CircleMarker
              center={p}
              radius={selected ? 9 : 6}
              interactive={false}
              pathOptions={{
                color,
                fillColor: selected ? color : '#fff',
                fillOpacity: 1,
                weight: selected ? 3 : 2,
              }}
            />
            <CircleMarker
              center={p}
              radius={16}
              pathOptions={{ opacity: 0, fillOpacity: 0, stroke: false }}
              eventHandlers={{
                click(e) {
                  e.originalEvent.stopPropagation();
                  if (mode === 'delete') {
                    onDeletePoint(activeDayIndex, pi);
                  } else {
                    onSelectPoint(pi);
                  }
                },
                mousedown(e) {
                  if (mode !== 'edit') return;
                  onSelectPoint(pi);
                  onBeginDrag();
                  const map = e.target._map;
                  map.dragging.disable();
                  const move = (ev: any) => {
                    onMovePoint(activeDayIndex, pi, [ev.latlng.lat, ev.latlng.lng]);
                  };
                  const up = () => {
                    map.off('mousemove', move);
                    map.off('mouseup', up);
                    map.dragging.enable();
                    onCommitDrag();
                  };
                  map.on('mousemove', move);
                  map.on('mouseup', up);
                },
              }}
            />
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
