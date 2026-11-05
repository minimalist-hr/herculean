import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayKeys, workoutKeys } from './query-keys';

/** Adds exercises at the end of a workout. */
export function useAddExercises(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseIds: string[]) => {
      const { data, error } = await api.POST(
        '/api/v1/workouts/{id}/exercises',
        {
          params: { path: { id: workoutId } },
          body: { exerciseIds },
        },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (workout) => {
      queryClient.setQueryData(workoutKeys.workout(workoutId), workout);
      await queryClient.invalidateQueries({ queryKey: dayKeys.allDay });
    },
    onError: (error) => {
      // A conflict says what stands in the way, for example no room left.
      notifyFailure(
        error instanceof ApiProblemError && error.problem.status === 409
          ? error.message
          : "Couldn't add the exercises. Try again.",
      );
    },
  });
}
