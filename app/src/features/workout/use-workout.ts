import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { workoutKeys } from './query-keys';

/** A workout with its exercises, sets and last time. */
export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.workout(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/workouts/{id}', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
