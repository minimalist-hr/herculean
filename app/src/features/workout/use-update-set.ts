import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { workoutKeys } from './query-keys';

type Workout = components['schemas']['WorkoutDetailsResponse'];

interface SetChange {
  workoutExerciseId: string;
  setId: string;
  changes: components['schemas']['UpdateSetRequest'];
}

/** Changes or checks a set. The API answers with all of the exercise's sets, because later ones can change with it. */
export function useUpdateSet(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutExerciseId, setId, changes }: SetChange) => {
      const { data, error } = await api.PATCH(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}',
        {
          params: { path: { id: workoutId, workoutExerciseId, setId } },
          body: changes,
        },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: (sets, { workoutExerciseId }) => {
      queryClient.setQueryData<Workout>(
        workoutKeys.workout(workoutId),
        (workout) =>
          workout && {
            ...workout,
            exercises: workout.exercises.map((exercise) =>
              exercise.id === workoutExerciseId
                ? { ...exercise, sets }
                : exercise,
            ),
          },
      );
    },
    onError: () => {
      notifyFailure('Couldn’t save the set. Try again.');
    },
  });
}
