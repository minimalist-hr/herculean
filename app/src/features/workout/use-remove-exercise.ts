import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/schema';
import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';

import { withoutExercise } from '@/features/routines/superset-blocks';

import { dayKeys, workoutKeys } from './query-keys';

type Workout = components['schemas']['WorkoutDetailsResponse'];
type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];

interface RemovedExercise {
  exercise: WorkoutExercise;
  /** Its place in the workout, to put it back there. */
  order: number;
  /** It was the second of a superset, which undoing it brings back. */
  supersetWithPrevious: boolean;
}

/** Removes an exercise with its sets, and offers to undo it. */
export function useRemoveExercise(workoutId: string) {
  const queryClient = useQueryClient();
  const refreshDays = () =>
    queryClient.invalidateQueries({ queryKey: dayKeys.allDay });

  const restore = useMutation({
    mutationFn: async ({
      exercise,
      order,
      supersetWithPrevious,
    }: RemovedExercise) => {
      const { data, error } = await api.POST(
        '/api/v1/workouts/{id}/exercises',
        {
          params: { path: { id: workoutId } },
          body: {
            removed: {
              order,
              exerciseId: exercise.exerciseId,
              targetSets: exercise.targetSets,
              targetRepsFrom: exercise.targetRepsFrom,
              targetRepsTo: exercise.targetRepsTo,
              sets: exercise.sets.map((set) => ({
                weightKg: set.weightKg,
                reps: set.reps,
                checked: set.checked,
              })),
              supersetWithNext: exercise.supersetWithNext,
              supersetWithPrevious,
            },
            asSuperset: false,
          },
        },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (workout) => {
      queryClient.setQueryData(workoutKeys.workout(workoutId), workout);
      await refreshDays();
    },
    onError: () => {
      notifyFailure('Couldn’t undo. Try again.');
    },
  });

  return useMutation({
    mutationFn: async ({ exercise }: RemovedExercise) => {
      const { error, response } = await api.DELETE(
        '/api/v1/workouts/{id}/exercises/{workoutExerciseId}',
        {
          params: {
            path: { id: workoutId, workoutExerciseId: exercise.id },
          },
        },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: async (_data, removed) => {
      const { exercise } = removed;
      queryClient.setQueryData<Workout>(
        workoutKeys.workout(workoutId),
        (workout) =>
          workout && {
            ...workout,
            exercises: withoutExercise(
              workout.exercises,
              workout.exercises.findIndex((other) => other.id === exercise.id),
            ),
          },
      );
      notifySuccess(`${exercise.name} removed.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate(removed);
        },
      });
      await refreshDays();
    },
    onError: () => {
      notifyFailure('Couldn’t remove the exercise. Try again.');
    },
  });
}
