import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';

import { dayKeys, workoutKeys } from './query-keys';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

/** Swaps an exercise for another, and offers to undo it with the values it had. */
export function useSwapExercise(workoutId: string) {
  const queryClient = useQueryClient();

  const send = async (
    workoutExerciseId: string,
    body: components['schemas']['SwapWorkoutExerciseRequest'],
  ) => {
    const { data, error } = await api.PATCH(
      '/api/v1/workouts/{id}/exercises/{workoutExerciseId}',
      {
        params: { path: { id: workoutId, workoutExerciseId } },
        body,
      },
    );
    if (data === undefined) {
      throw toApiError(error);
    }

    return data;
  };
  const show = async (
    workout: components['schemas']['WorkoutDetailsResponse'],
  ) => {
    queryClient.setQueryData(workoutKeys.workout(workoutId), workout);
    await queryClient.invalidateQueries({ queryKey: dayKeys.allDay });
  };

  const undo = useMutation({
    mutationFn: (exercise: WorkoutExercise) =>
      send(exercise.id, {
        exerciseId: exercise.exerciseId,
        sets: exercise.sets.map((set) => ({
          weightKg: set.weightKg,
          reps: set.reps,
        })),
      }),
    onSuccess: show,
    onError: (error) => {
      notifyFailure(
        error instanceof ApiProblemError && error.problem.status === 409
          ? error.message
          : 'Couldn’t undo. Try again.',
      );
    },
  });

  return useMutation({
    mutationFn: ({
      exercise,
      newExerciseId,
    }: {
      exercise: WorkoutExercise;
      newExerciseId: string;
      newName: string;
    }) => send(exercise.id, { exerciseId: newExerciseId }),
    onSuccess: async (workout, { exercise, newName }) => {
      await show(workout);
      notifySuccess(`${exercise.name} swapped for ${newName}.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          undo.mutate(exercise);
        },
      });
    },
    onError: (error) => {
      // A conflict says what stands in the way, for example a set checked since.
      notifyFailure(
        error instanceof ApiProblemError && error.problem.status === 409
          ? error.message
          : 'Couldn’t swap the exercise. Try again.',
      );
    },
  });
}
