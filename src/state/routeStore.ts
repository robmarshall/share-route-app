import { useReducer, useCallback } from 'react';

export type Point = [number, number];
export type Day = { name: string; points: Point[] };
export type Mode = 'add' | 'edit' | 'delete';

export type RouteState = {
  days: Day[];
  activeDayIndex: number;
};

type Action =
  | { type: 'set'; days: Day[] }
  | { type: 'addDay' }
  | { type: 'deleteDay'; index: number }
  | { type: 'renameDay'; index: number; name: string }
  | { type: 'setActive'; index: number }
  | { type: 'addPoint'; point: Point }
  | { type: 'movePoint'; dayIndex: number; pointIndex: number; point: Point }
  | { type: 'deletePoint'; dayIndex: number; pointIndex: number };

const initial: RouteState = {
  days: [{ name: 'Day 1', points: [] }],
  activeDayIndex: 0,
};

function reducer(state: RouteState, action: Action): RouteState {
  switch (action.type) {
    case 'set': {
      const days = action.days.length ? action.days : initial.days;
      return { days, activeDayIndex: Math.min(state.activeDayIndex, days.length - 1) };
    }
    case 'addDay': {
      const days = [...state.days, { name: `Day ${state.days.length + 1}`, points: [] }];
      return { days, activeDayIndex: days.length - 1 };
    }
    case 'deleteDay': {
      if (state.days.length <= 1) return { ...state, days: [{ name: 'Day 1', points: [] }], activeDayIndex: 0 };
      const days = state.days.filter((_, i) => i !== action.index);
      const activeDayIndex = Math.max(0, Math.min(state.activeDayIndex, days.length - 1));
      return { days, activeDayIndex };
    }
    case 'renameDay': {
      const days = state.days.map((d, i) => (i === action.index ? { ...d, name: action.name } : d));
      return { ...state, days };
    }
    case 'setActive':
      return { ...state, activeDayIndex: action.index };
    case 'addPoint': {
      const days = state.days.map((d, i) =>
        i === state.activeDayIndex ? { ...d, points: [...d.points, action.point] } : d,
      );
      return { ...state, days };
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
      return { ...state, days };
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
  };
  return { state, actions };
}
