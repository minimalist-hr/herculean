import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayKeys, workoutKeys } from './query-keys';

type Workout = components['schemas']['WorkoutDetailsResponse'];
type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

/** Saves a new order on each drop. The list shows it at once, because a dropped row can't wait for an answer. */
export function useReorderExercises(workoutId: string) {
  const queryClient = useQueryClient();
  const key = workoutKeys.workout(workoutId);

  return useMutation({
    mutationFn: async (exercises: WorkoutExercise[]) => {
      const { error, response } = await api.PUT(
        '/api/v1/workouts/{id}/exercise-order',
        {
          params: { path: { id: workoutId } },
          body: { workoutExerciseIds: exercises.map((item) => item.id) },
        },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onMutate: (exercises) => {
      const before = queryClient.getQueryData<Workout>(key);
      queryClient.setQueryData<Workout>(
        key,
        (workout) => workout && { ...workout, exercises },
      );

      return { before };
    },
    onError: (_error, _exercises, context) => {
      queryClient.setQueryData(key, context?.before);
      notifyFailure('Couldn’t save the order. Try again.');
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: dayKeys.allDay }),
  });
}
