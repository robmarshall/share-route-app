export const DAY_COLORS = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
  '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080',
];

export const colorForDay = (index: number): string =>
  DAY_COLORS[index % DAY_COLORS.length];
