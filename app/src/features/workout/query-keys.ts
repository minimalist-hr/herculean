export const workoutKeys = {
  all: ['workout'] as const,
  settings: ['workout-settings'] as const,
  inProgress: ['workouts', 'inProgress'] as const,
  workout: (id: string) => ['workout', id] as const,
  summary: (id: string) => ['workout', id, 'summary'] as const,
};

export const dayKeys = {
  allDay: ['day'] as const,
  allDays: ['days'] as const,
  allMonths: ['month-summary'] as const,
  first: ['first-day'] as const,
  streak: ['streak'] as const,
  recentRecords: ['recent-records'] as const,
  day: (date: string) => ['day', date] as const,
  days: (from: string, to: string) => ['days', from, to] as const,
  month: (month: string) => ['month-summary', month] as const,
};

/** Everything that shows days: what a change to a workout or the plan refreshes. */
export const dayDataKeys = [
  dayKeys.allDay,
  dayKeys.allDays,
  dayKeys.allMonths,
  dayKeys.first,
  dayKeys.streak,
  dayKeys.recentRecords,
];
