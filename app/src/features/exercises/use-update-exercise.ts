import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { routineKeys } from '@/features/routines/query-keys';

import { exerciseKeys } from './query-keys';

interface UpdateExercise {
  name: string;
  groupId: string;
  alsoWorksGroupIds: string[];
}

/** Changes an exercise, then refreshes it, every exercise list and the routines that show its name. */
export function useUpdateExercise(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateExercise) => {
      const { data, error } = await api.PUT('/api/v1/exercises/{id}', {
        params: { path: { id } },
        body,
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
        queryClient.invalidateQueries({ queryKey: exerciseKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: routineKeys.details }),
      ]),
  });
}
