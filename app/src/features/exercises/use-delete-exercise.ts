import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';

import { exerciseKeys } from './query-keys';

interface DeletedExercise {
  id: string;
  name: string;
}

/** The API's own words when they help, or else a general failure. */
function undoFailureOf(error: unknown) {
  return error instanceof ApiProblemError &&
    error.problem.code === 'exercise.name_taken'
    ? error.problem.detail
    : "Couldn't undo. Try again.";
}

/** Deletes an exercise and says so, with an Undo that restores it. It runs on after the screen closes. */
export function useDeleteExercise() {
  const queryClient = useQueryClient();

  // Not its details: they stay until their screen closes, so it never reads them again.
  const refresh = () =>
    Promise.all(
      [exerciseKeys.all, exerciseKeys.groups].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/exercises/{id}/restore', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: refresh,
    onError: (error) => {
      notifyFailure(undoFailureOf(error));
    },
  });

  return useMutation({
    mutationFn: async ({ id }: DeletedExercise) => {
      const { error, response } = await api.DELETE('/api/v1/exercises/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: async (_data, exercise) => {
      await refresh();
      notifySuccess(`${exercise.name} deleted.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate(exercise.id);
        },
      });
    },
    onError: () => {
      notifyFailure("Couldn't delete the exercise. Try again.");
    },
  });
}
