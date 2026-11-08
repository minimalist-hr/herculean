export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (search: string | undefined, groupId: string | undefined) =>
    ['exercises', { search, groupId }] as const,
  // Under "all", so a change to an exercise refreshes it too.
  group: (id: string) => ['exercises', 'group', id] as const,
  details: ['exercise'] as const,
  detail: (id: string) => ['exercise', id] as const,
  // Under the exercise, so a change to it refreshes its sessions too.
  sessions: (id: string) => ['exercise', id, 'sessions'] as const,
  progress: (id: string, range: string) =>
    ['exercise', id, 'progress', range] as const,
  lastTime: (id: string, before: string) =>
    ['exercise', id, 'last-time', before] as const,
  groups: ['groups'] as const,
};
