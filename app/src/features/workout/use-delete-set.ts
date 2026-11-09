import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';

import { workoutKeys } from './query-keys';
import { useAddSet } from './use-add-set';

type Workout = components['schemas']['WorkoutDetailsResponse'];

interface SetToRemove {
  workoutExerciseId: string;
  set: components['schemas']['SetResponse'];
}

/** Removes a set straight away, and offers to undo it. */
export function useDeleteSet(workoutId: string) {
  const queryClient = useQueryClient();
  const restore = useAddSet(workoutId);

  return useMutation({
    mutationFn: async ({ workoutExerciseId, set }: SetToRemove) => {
      const { response, error } = await api.DELETE(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}/sets/{setId}',
        {
          params: {
            path: { id: workoutId, workoutExerciseId, setId: set.id },
          },
        },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: (_data, { workoutExerciseId, set }) => {
      queryClient.setQueryData<Workout>(
        workoutKeys.workout(workoutId),
        (workout) =>
          workout && {
            ...workout,
            exercises: workout.exercises.map((exercise) =>
              exercise.id === workoutExerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets
                      .filter((other) => other.id !== set.id)
                      .map((other) =>
                        other.order > set.order
                          ? { ...other, order: other.order - 1 }
                          : other,
                      ),
                  }
                : exercise,
            ),
          },
      );
      notifySuccess(`Set ${String(set.order + 1)} removed.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate({
            workoutExerciseId,
            removed: {
              order: set.order,
              weightKg: set.weightKg,
              reps: set.reps,
              checked: set.checked,
            },
          });
        },
      });
    },
    onError: () => {
      notifyFailure('Couldn’t remove the set. Try again.');
    },
  });
}
