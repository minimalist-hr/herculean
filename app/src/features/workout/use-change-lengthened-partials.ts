import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { workoutKeys } from './query-keys';

interface PartialsChange {
  workoutExerciseId: string;
  lengthenedPartials: boolean;
}

/** Turns lengthened partials on or off for an exercise in this workout only. */
export function useChangeLengthenedPartials(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutExerciseId,
      lengthenedPartials,
    }: PartialsChange) => {
      const { data, error } = await api.PUT(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}/lengthened-partials',
        {
          params: { path: { id: workoutId, workoutExerciseId } },
          body: { lengthenedPartials },
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
      notifyFailure('Couldn’t change lengthened partials. Try again.');
    },
  });
}
