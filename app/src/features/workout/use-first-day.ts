import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { dayKeys } from './query-keys';

/** The first day the user can reach. */
export function useFirstDay() {
  return useQuery({
    queryKey: dayKeys.first,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/days/first');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.date;
    },
  });
}
