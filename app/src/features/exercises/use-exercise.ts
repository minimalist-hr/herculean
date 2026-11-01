import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** One exercise and its groups. */
export function useExercise(id: string) {
  return useQuery({
    queryKey: exerciseKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/exercises/{id}', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
