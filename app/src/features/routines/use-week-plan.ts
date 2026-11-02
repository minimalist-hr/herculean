import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { routineKeys } from './query-keys';

/** What each weekday holds now, from Monday. */
export function useWeekPlan() {
  return useQuery({
    queryKey: routineKeys.weekPlan,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/week-plan-days');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
