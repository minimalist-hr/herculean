import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { dayKeys } from './query-keys';

/** One day: its status, its routine and the day after it. */
export function useDay(date: string) {
  return useQuery({
    queryKey: dayKeys.day(date),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/days/{date}', {
        params: { path: { date } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
