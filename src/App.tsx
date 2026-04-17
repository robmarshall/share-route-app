import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouteStore, type Mode, type Point, type Day } from './state/routeStore';
import { useUrlSync } from './state/urlSync';
import { dayDistanceKm } from './lib/distance';
import { Toolbar } from './components/Toolbar';
import { DaySidebar } from './components/DaySidebar';
import { MapView, type Basemap } from './components/MapView';
import './App.css';

export default function App() {
  const { state, actions, canUndo, canRedo } = useRouteStore();
  const [mode, setMode] = useState<Mode>('add');
  const [basemap, setBasemap] = useState<Basemap>('street');
  const [flyTo, setFlyTo] = useState<{ center: Point; zoom: number } | null>(null);
  const [fitBounds, setFitBounds] = useState<Point[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const daysRef = useRef(state.days);
  useEffect(() => {
    daysRef.current = state.days;
  }, [state.days]);
  const dragSnapshotRef = useRef<Day[] | null>(null);

  const urlSize = useUrlSync(state.days, (loaded) => {
    actions.setDays(loaded);
    setSelectedPointIndex(null);
    const first = loaded[0];
    if (first && first.points.length) setFitBounds(first.points);
  });

  const totalKm = useMemo(
    () => state.days.reduce((sum, d) => sum + dayDistanceKm(d.points), 0),
    [state.days],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        actions.redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

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
        onUndo={actions.undo}
        onRedo={actions.redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="main">
        <DaySidebar
          days={state.days}
          activeDayIndex={state.activeDayIndex}
          setActive={(i) => {
            actions.setActive(i);
            setSelectedPointIndex(null);
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
            selectedPointIndex={selectedPointIndex}
            onAddPoint={(p) => {
              const newIndex = daysRef.current[state.activeDayIndex]?.points.length ?? 0;
              actions.addPoint(p);
              setSelectedPointIndex(newIndex);
            }}
            onMovePoint={actions.movePoint}
            onDeletePoint={(dayIndex, pointIndex) => {
              actions.deletePoint(dayIndex, pointIndex);
              setSelectedPointIndex((sel) => {
                if (sel === null) return null;
                if (sel === pointIndex) return null;
                if (sel > pointIndex) return sel - 1;
                return sel;
              });
            }}
            onSelectPoint={setSelectedPointIndex}
            onBackgroundClick={() => setSelectedPointIndex(null)}
            onBeginDrag={() => {
              dragSnapshotRef.current = daysRef.current;
            }}
            onCommitDrag={() => {
              if (dragSnapshotRef.current) {
                actions.commitDrag(dragSnapshotRef.current);
                dragSnapshotRef.current = null;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
