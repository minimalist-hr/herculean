import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { workoutKeys } from './query-keys';

/** The default rest time and the rest of the user's workout settings. */
export function useWorkoutSettings() {
  return useQuery({
    queryKey: workoutKeys.settings,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/workout-settings');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
