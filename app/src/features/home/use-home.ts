import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { dayKeys } from '@/features/workout/query-keys';

/** Finished weeks in a row on plan. */
export function useStreak() {
  return useQuery({
    queryKey: dayKeys.streak,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/streak');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** Up to three records from the last 30 days, newest first. */
export function useRecentRecords() {
  return useQuery({
    queryKey: dayKeys.recentRecords,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/records/recent');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
