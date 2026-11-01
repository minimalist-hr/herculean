export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (search: string | undefined, groupId: string | undefined) =>
    ['exercises', { search, groupId }] as const,
  // Under "all", so a change to an exercise refreshes it too.
  group: (id: string) => ['exercises', 'group', id] as const,
  details: ['exercise'] as const,
  detail: (id: string) => ['exercise', id] as const,
  groups: ['groups'] as const,
};
