import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** The exercises by group order, then name. The last list stays up while a new search loads. */
export function useExercises(
  search: string | undefined,
  groupId: string | undefined,
) {
  return useQuery({
    queryKey: exerciseKeys.list(search, groupId),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/exercises', {
        params: { query: { search, groupId } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    placeholderData: keepPreviousData,
  });
}
