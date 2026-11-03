export const routineKeys = {
  all: ['routines'] as const,
  weekPlan: ['week-plan'] as const,
  details: ['routine'] as const,
  detail: (id: string) => ['routine', id] as const,
};
