import { useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** An exercise's sessions, 20 at a time, newest first. */
export function useExerciseSessions(id: string) {
  return useInfiniteQuery({
    queryKey: exerciseKeys.sessions(id),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/v1/exercises/{id}/sessions', {
        params: { path: { id }, query: { cursor: pageParam } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
