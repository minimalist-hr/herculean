import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

export const progressRanges = ['3m', '6m', '1y', 'all'] as const;

export type ProgressRange = (typeof progressRanges)[number];

/** An exercise's heaviest sets over a range. Nothing is read for an exercise not done yet. */
export function useExerciseProgress(
  id: string,
  range: ProgressRange,
  done: boolean,
) {
  return useQuery({
    queryKey: exerciseKeys.progress(id, range),
    enabled: done,
    // The chart keeps the last range while the next one loads.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/exercises/{id}/progress', {
        params: { path: { id }, query: { range } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
