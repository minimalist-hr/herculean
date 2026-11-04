import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { dayKeys } from './query-keys';

/** A month's counts and totals. The month reads like "2026-10". */
export function useMonthSummary(month: string) {
  return useQuery({
    queryKey: dayKeys.month(month),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/month-summaries/{month}', {
        params: { path: { month } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
