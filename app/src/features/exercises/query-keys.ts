export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (search: string | undefined, groupId: string | undefined) =>
    ['exercises', { search, groupId }] as const,
  detail: (id: string) => ['exercise', id] as const,
  groups: ['groups'] as const,
};
