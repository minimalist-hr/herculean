import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { routineKeys } from '@/features/routines/query-keys';

import { dayKeys, workoutKeys } from './query-keys';

/** How many pages back the day is, from the finish page: past logging. */
const pagesBackToDay = 2;

const changedByAWorkout = [
  dayKeys.allDay,
  dayKeys.allDays,
  dayKeys.allMonths,
  routineKeys.all,
];

function failureMessage(error: Error, fallback: string) {
  // A conflict says what stands in the way, for example another workout in progress.
  return error instanceof ApiProblemError && error.problem.status === 409
    ? error.message
    : fallback;
}

/** Saves a workout with what was checked, then goes back to its day. */
export function useSaveWorkout(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.PATCH('/api/v1/workouts/{id}', {
        params: { path: { id } },
        body: { status: 'completed' },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: async () => {
      router.dismiss(pagesBackToDay);
      await Promise.all(
        [...changedByAWorkout, workoutKeys.workout(id)].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    onError: (error) => {
      notifyFailure(
        failureMessage(error, "Couldn't save the workout. Try again."),
      );
    },
  });
}

/** Discards a workout, goes back to its day, and offers to undo it. The undo leaves you on the day. */
export function useDiscardWorkout(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  function refreshDays() {
    return Promise.all(
      changedByAWorkout.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  }

  const restore = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/v1/workouts/{id}/restore', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: refreshDays,
    onError: (error) => {
      notifyFailure(failureMessage(error, "Couldn't undo. Try again."));
    },
  });

  return useMutation({
    mutationFn: async () => {
      const { response, error } = await api.DELETE('/api/v1/workouts/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: async () => {
      router.dismiss(pagesBackToDay);
      notifySuccess('Workout discarded.', {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate();
        },
      });
      await refreshDays();
    },
    onError: () => {
      notifyFailure("Couldn't discard the workout. Try again.");
    },
  });
}
