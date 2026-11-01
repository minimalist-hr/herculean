import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** Deletes an exercise, then refreshes every exercise list. Its details stay until their screens close, so they never read it again. */
export function useDeleteExercise(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.DELETE('/api/v1/exercises/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
}
