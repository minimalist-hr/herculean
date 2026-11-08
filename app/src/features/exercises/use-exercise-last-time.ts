import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** An exercise's sets in its latest completed workout before a date. */
export function useExerciseLastTime(
  id: string,
  before: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: exerciseKeys.lastTime(id, before),
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET(
        '/api/v1/exercises/{id}/last-time',
        { params: { path: { id }, query: { before } } },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.lastTime;
    },
  });
}
