import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import { afterSheetsClose, notifyFailure } from '@/components/notifications';

import { dayDataKeys, workoutKeys } from './query-keys';

/** Starts a day's workout from its routine, one picked for that day, or empty, then opens logging. With replace, logging takes the place of the current page. */
export function useStartWorkout({ replace = false } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      date,
      routineId,
      empty = false,
    }: {
      date: string;
      routineId?: string;
      /** No routine and no exercises: they're added while logging. */
      empty?: boolean;
    }) => {
      const { data, error } = await api.POST('/api/v1/workouts', {
        body: { date, status: 'inProgress', routineId, empty },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (workout) => {
      const logging = `/workout/log/${workout.id}` as Href;
      // A sheet that started it slides down first.
      afterSheetsClose(() => {
        if (replace) {
          router.replace(logging);
        } else {
          router.push(logging);
        }
      });
      await Promise.all(
        [...dayDataKeys, workoutKeys.inProgress].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    onError: (error) => {
      // A conflict says what stands in the way, for example another workout in progress.
      notifyFailure(
        error instanceof ApiProblemError && error.problem.status === 409
          ? error.message
          : 'Couldn’t start the workout. Try again.',
      );
    },
  });
}
