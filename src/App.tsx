import { useState, useMemo } from 'react';
import { useRouteStore, type Mode, type Point } from './state/routeStore';
import { useUrlSync } from './state/urlSync';
import { dayDistanceKm } from './lib/distance';
import { Toolbar } from './components/Toolbar';
import { DaySidebar } from './components/DaySidebar';
import { MapView, type Basemap } from './components/MapView';
import './App.css';

export default function App() {
  const { state, actions } = useRouteStore();
  const [mode, setMode] = useState<Mode>('add');
  const [basemap, setBasemap] = useState<Basemap>('street');
  const [flyTo, setFlyTo] = useState<{ center: Point; zoom: number } | null>(null);
  const [fitBounds, setFitBounds] = useState<Point[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const urlSize = useUrlSync(state.days, (loaded) => {
    actions.setDays(loaded);
    const first = loaded[0];
    if (first && first.points.length) setFitBounds(first.points);
  });

  const totalKm = useMemo(
    () => state.days.reduce((sum, d) => sum + dayDistanceKm(d.points), 0),
    [state.days],
  );

  return (
    <div className="app">
      <Toolbar
        mode={mode}
        setMode={setMode}
        basemap={basemap}
        setBasemap={setBasemap}
        onAddDay={actions.addDay}
        onGeocoded={(r) => setFlyTo({ center: r.center, zoom: r.zoom })}
        urlSize={urlSize}
        totalKm={totalKm}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <div className="main">
        <DaySidebar
          days={state.days}
          activeDayIndex={state.activeDayIndex}
          setActive={(i) => {
            actions.setActive(i);
            setSidebarOpen(false);
          }}
          renameDay={actions.renameDay}
          deleteDay={actions.deleteDay}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="map-wrap">
          <MapView
            days={state.days}
            activeDayIndex={state.activeDayIndex}
            mode={mode}
            basemap={basemap}
            flyTo={flyTo}
            fitBounds={fitBounds}
            onAddPoint={actions.addPoint}
            onMovePoint={actions.movePoint}
            onDeletePoint={actions.deletePoint}
          />
        </div>
      </div>
    </div>
  );
}
