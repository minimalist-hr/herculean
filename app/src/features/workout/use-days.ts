import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { dayKeys } from './query-keys';

/** Each day's status from the first date to the last. */
export function useDays(from: string, to: string) {
  return useQuery({
    queryKey: dayKeys.days(from, to),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/days', {
        params: { query: { from, to } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
