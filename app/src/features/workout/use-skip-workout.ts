import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayDataKeys } from './query-keys';

/** Skips a day's workout. The day's card then shows it, with Undo skip. */
export function useSkipWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const { data, error } = await api.POST('/api/v1/workouts', {
        body: { date, status: 'skipped' },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      Promise.all(
        dayDataKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    onError: () => {
      notifyFailure('Couldn’t skip the workout. Try again.');
    },
  });
}
