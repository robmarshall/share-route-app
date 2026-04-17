import { useReducer, useCallback } from 'react';

export type Point = [number, number];
export type Day = { name: string; points: Point[] };
export type Mode = 'freestyle' | 'snap' | 'edit' | 'delete';

export type RouteState = {
  days: Day[];
  activeDayIndex: number;
  past: Day[][];
  future: Day[][];
};

type Action =
  | { type: 'set'; days: Day[] }
  | { type: 'addDay' }
  | { type: 'deleteDay'; index: number }
  | { type: 'renameDay'; index: number; name: string }
  | { type: 'setActive'; index: number }
  | { type: 'addPoint'; point: Point }
  | { type: 'extendPoints'; dayIndex: number; points: Point[] }
  | { type: 'movePoint'; dayIndex: number; pointIndex: number; point: Point }
  | { type: 'deletePoint'; dayIndex: number; pointIndex: number }
  | { type: 'commitDrag'; snapshot: Day[] }
  | { type: 'undo' }
  | { type: 'redo' };

const initial: RouteState = {
  days: [{ name: 'Day 1', points: [] }],
  activeDayIndex: 0,
  past: [],
  future: [],
};

function pushHistory(state: RouteState): Pick<RouteState, 'past' | 'future'> {
  return { past: [...state.past, state.days], future: [] };
}

function reducer(state: RouteState, action: Action): RouteState {
  switch (action.type) {
    case 'set': {
      const days = action.days.length ? action.days : initial.days;
      return {
        days,
        activeDayIndex: Math.min(state.activeDayIndex, days.length - 1),
        past: [],
        future: [],
      };
    }
    case 'addDay': {
      const days = [...state.days, { name: `Day ${state.days.length + 1}`, points: [] }];
      return { ...state, days, activeDayIndex: days.length - 1, past: [], future: [] };
    }
    case 'deleteDay': {
      if (state.days.length <= 1) {
        return { ...state, days: [{ name: 'Day 1', points: [] }], activeDayIndex: 0, past: [], future: [] };
      }
      const days = state.days.filter((_, i) => i !== action.index);
      const activeDayIndex = Math.max(0, Math.min(state.activeDayIndex, days.length - 1));
      return { ...state, days, activeDayIndex, past: [], future: [] };
    }
    case 'renameDay': {
      const days = state.days.map((d, i) => (i === action.index ? { ...d, name: action.name } : d));
      return { ...state, days, past: [], future: [] };
    }
    case 'setActive':
      return { ...state, activeDayIndex: action.index };
    case 'addPoint': {
      const days = state.days.map((d, i) =>
        i === state.activeDayIndex ? { ...d, points: [...d.points, action.point] } : d,
      );
      return { ...state, days, ...pushHistory(state) };
    }
    case 'extendPoints': {
      if (action.points.length === 0) return state;
      const days = state.days.map((d, i) => {
        if (i !== action.dayIndex) return d;
        const base = d.points.length > 0 ? d.points.slice(0, -1) : [];
        return { ...d, points: [...base, ...action.points] };
      });
      return { ...state, days, ...pushHistory(state) };
    }
    case 'movePoint': {
      const days = state.days.map((d, i) =>
        i === action.dayIndex
          ? { ...d, points: d.points.map((p, j) => (j === action.pointIndex ? action.point : p)) }
          : d,
      );
      return { ...state, days };
    }
    case 'deletePoint': {
      const days = state.days.map((d, i) =>
        i === action.dayIndex
          ? { ...d, points: d.points.filter((_, j) => j !== action.pointIndex) }
          : d,
      );
      return { ...state, days, ...pushHistory(state) };
    }
    case 'commitDrag': {
      if (action.snapshot === state.days) return state;
      return { ...state, past: [...state.past, action.snapshot], future: [] };
    }
    case 'undo': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const past = state.past.slice(0, -1);
      return { ...state, days: previous, past, future: [...state.future, state.days] };
    }
    case 'redo': {
      if (state.future.length === 0) return state;
      const next = state.future[state.future.length - 1];
      const future = state.future.slice(0, -1);
      return { ...state, days: next, past: [...state.past, state.days], future };
    }
  }
}

export function useRouteStore() {
  const [state, dispatch] = useReducer(reducer, initial);
  const actions = {
    setDays: useCallback((days: Day[]) => dispatch({ type: 'set', days }), []),
    addDay: useCallback(() => dispatch({ type: 'addDay' }), []),
    deleteDay: useCallback((index: number) => dispatch({ type: 'deleteDay', index }), []),
    renameDay: useCallback((index: number, name: string) => dispatch({ type: 'renameDay', index, name }), []),
    setActive: useCallback((index: number) => dispatch({ type: 'setActive', index }), []),
    addPoint: useCallback((point: Point) => dispatch({ type: 'addPoint', point }), []),
    extendPoints: useCallback(
      (dayIndex: number, points: Point[]) =>
        dispatch({ type: 'extendPoints', dayIndex, points }),
      [],
    ),
    movePoint: useCallback(
      (dayIndex: number, pointIndex: number, point: Point) =>
        dispatch({ type: 'movePoint', dayIndex, pointIndex, point }),
      [],
    ),
    deletePoint: useCallback(
      (dayIndex: number, pointIndex: number) =>
        dispatch({ type: 'deletePoint', dayIndex, pointIndex }),
      [],
    ),
    commitDrag: useCallback((snapshot: Day[]) => dispatch({ type: 'commitDrag', snapshot }), []),
    undo: useCallback(() => dispatch({ type: 'undo' }), []),
    redo: useCallback(() => dispatch({ type: 'redo' }), []),
  };
  return {
    state,
    actions,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
