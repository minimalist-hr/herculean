import { useQueryClient } from '@tanstack/react-query';

import { exerciseKeys } from './query-keys';

/** Refreshes everything that shows a group: the groups, the exercise lists and an exercise's details. */
export function useRefreshGroups() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(
      [exerciseKeys.groups, exerciseKeys.all, exerciseKeys.details].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
}
