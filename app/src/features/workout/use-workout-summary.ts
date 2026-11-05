import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { workoutKeys } from './query-keys';

/** What a workout comes to. It is asked for fresh each time, because every set changes it. */
export function useWorkoutSummary(id: string) {
  return useQuery({
    queryKey: workoutKeys.summary(id),
    gcTime: 0,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/workouts/{id}/summary', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
