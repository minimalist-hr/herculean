import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { workoutKeys } from './query-keys';

/** The workout in progress, on any day, or null when none is. */
export function useWorkoutInProgress() {
  return useQuery({
    queryKey: workoutKeys.inProgress,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/workouts', {
        params: { query: { status: 'inProgress' } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data[0] ?? null;
    },
  });
}
