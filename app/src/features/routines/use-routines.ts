import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { routineKeys } from './query-keys';

/** The routines, by their first planned weekday, then name. */
export function useRoutines() {
  return useQuery({
    queryKey: routineKeys.all,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/routines');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
