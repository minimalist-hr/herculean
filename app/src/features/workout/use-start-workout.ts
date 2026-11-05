import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayKeys } from './query-keys';

/** Starts a day's workout from its routine, then opens logging. */
export function useStartWorkout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (date: string) => {
      const { data, error } = await api.POST('/api/v1/workouts', {
        body: { date, status: 'inProgress' },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (workout) => {
      router.push(`/workout/log/${workout.id}` as Href);
      await Promise.all(
        [dayKeys.allDay, dayKeys.allDays, dayKeys.allMonths].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    onError: (error) => {
      // A conflict says what stands in the way, for example another workout in progress.
      notifyFailure(
        error instanceof ApiProblemError && error.problem.status === 409
          ? error.message
          : "Couldn't start the workout. Try again.",
      );
    },
  });
}
