import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { routineKeys } from './query-keys';

/** One routine, its days and its exercises. */
export function useRoutine(id: string) {
  return useQuery({
    queryKey: routineKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/routines/{id}', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
