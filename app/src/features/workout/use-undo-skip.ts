import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';

import { dayKeys } from './query-keys';

/** Undoes a skip. The day reads from the week plan again: planned today, missed if it has passed. */
export function useUndoSkip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await api.DELETE('/api/v1/workouts/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      Promise.all(
        [dayKeys.allDay, dayKeys.allDays].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    onError: () => {
      notifyFailure("Couldn't undo. Try again.");
    },
  });
}
