import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { workoutKeys } from './query-keys';

interface SupersetChange {
  workoutExerciseId: string;
  supersetWithNext: boolean;
}

/** Pairs an exercise of a workout in progress with the one after it, or ends its superset. */
export function useChangeSuperset(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutExerciseId,
      supersetWithNext,
    }: SupersetChange) => {
      const { data, error } = await api.PUT(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}/superset',
        {
          params: { path: { id: workoutId, workoutExerciseId } },
          body: { supersetWithNext },
        },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: (workout) => {
      queryClient.setQueryData(workoutKeys.workout(workoutId), workout);
    },
    onError: () => {
      notifyFailure('Couldn’t change the superset. Try again.');
    },
  });
}
