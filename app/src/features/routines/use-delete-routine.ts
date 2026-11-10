import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { exerciseKeys } from '@/features/exercises/query-keys';
import { dayDataKeys } from '@/features/workout/query-keys';

import { routineKeys } from './query-keys';

interface DeletedRoutine {
  id: string;
  name: string;
}

/** The API's own words when they help, or else a general failure. */
function undoFailureOf(error: unknown) {
  return error instanceof ApiProblemError &&
    (error.problem.code === 'routine.name_taken' ||
      error.problem.code === 'routine.exercise_deleted')
    ? error.problem.detail
    : 'Couldn’t undo. Try again.';
}

/** Deletes a routine and says so, with an Undo that restores it and its days. It runs on after the screen closes. */
export function useDeleteRoutine() {
  const queryClient = useQueryClient();

  // Not its details: they stay until their screen closes, so it never reads them again.
  const refresh = () =>
    Promise.all(
      [
        routineKeys.all,
        routineKeys.weekPlan,
        exerciseKeys.details,
        ...dayDataKeys,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/routines/{id}/restore', {
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
    mutationFn: async ({ id }: DeletedRoutine) => {
      const { error, response } = await api.DELETE('/api/v1/routines/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: async (_data, routine) => {
      await refresh();
      notifySuccess(`${routine.name} deleted.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate(routine.id);
        },
      });
    },
    onError: () => {
      notifyFailure('Couldn’t delete the routine. Try again.');
    },
  });
}
