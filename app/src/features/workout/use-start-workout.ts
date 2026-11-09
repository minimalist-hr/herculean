import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayKeys, workoutKeys } from './query-keys';

/** Starts a day's workout from its routine, or one picked for that day, then opens logging. With replace, logging takes the place of the current page. */
export function useStartWorkout({ replace = false } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      date,
      routineId,
    }: {
      date: string;
      routineId?: string;
    }) => {
      const { data, error } = await api.POST('/api/v1/workouts', {
        body: { date, status: 'inProgress', routineId },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (workout) => {
      const logging = `/workout/log/${workout.id}` as Href;
      if (replace) {
        router.replace(logging);
      } else {
        router.push(logging);
      }
      await Promise.all(
        [
          dayKeys.allDay,
          dayKeys.allDays,
          dayKeys.allMonths,
          workoutKeys.inProgress,
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
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
