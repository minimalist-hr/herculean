import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { workoutKeys } from './query-keys';

type Workout = components['schemas']['WorkoutDetailsResponse'];

interface NewSet {
  workoutExerciseId: string;
  /** The removed set to put back. Without one, the new set copies the last set. */
  removed?: components['schemas']['RemovedSet'];
}

/** Adds a set to an exercise, or puts a removed one back. */
export function useAddSet(workoutId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutExerciseId, removed }: NewSet) => {
      const { data, error } = await api.POST(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets',
        {
          params: { path: { id: workoutId, workoutExerciseId } },
          body: { removed },
        },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: (set, { workoutExerciseId }) => {
      queryClient.setQueryData<Workout>(
        workoutKeys.workout(workoutId),
        (workout) =>
          workout && {
            ...workout,
            exercises: workout.exercises.map((exercise) =>
              exercise.id === workoutExerciseId
                ? {
                    ...exercise,
                    sets: [
                      ...exercise.sets.map((other) =>
                        other.order >= set.order
                          ? { ...other, order: other.order + 1 }
                          : other,
                      ),
                      set,
                    ].sort((first, second) => first.order - second.order),
                  }
                : exercise,
            ),
          },
      );
    },
    onError: (_error, { removed }) => {
      notifyFailure(
        removed
          ? 'Couldn’t undo. Try again.'
          : 'Couldn’t add the set. Try again.',
      );
    },
  });
}
