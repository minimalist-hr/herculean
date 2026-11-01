export const exerciseKeys = {
  list: (search: string | undefined, groupId: string | undefined) =>
    ['exercises', { search, groupId }] as const,
  groups: ['groups'] as const,
};
