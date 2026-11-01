import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

interface CreateExercise {
  name: string;
  groupId: string;
  alsoWorksGroupIds: string[];
}

/** Creates an exercise, then refreshes every exercise list. */
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateExercise) => {
      const { data, error } = await api.POST('/api/v1/exercises', { body });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
}
