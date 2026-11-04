export const dayKeys = {
  allDay: ['day'] as const,
  allDays: ['days'] as const,
  first: ['first-day'] as const,
  day: (date: string) => ['day', date] as const,
  days: (from: string, to: string) => ['days', from, to] as const,
};
