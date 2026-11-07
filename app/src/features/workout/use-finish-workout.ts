import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { exerciseKeys } from '@/features/exercises/query-keys';
import { routineKeys } from '@/features/routines/query-keys';

import { dayKeys, workoutKeys } from './query-keys';

/** How many pages back the day is, from the finish page: past logging. */
const pagesBackToDay = 2;

const changedByAWorkout = [
  workoutKeys.inProgress,
  dayKeys.allDay,
  dayKeys.allDays,
  dayKeys.allMonths,
  routineKeys.all,
  exerciseKeys.all,
  exerciseKeys.details,
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

/** Refreshes everything a workout's change shows in. */
function useRefreshAfterWorkout() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all(
      changedByAWorkout.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** Puts back a deleted or discarded workout, and offers it as Undo on a notification. */
function useUndoRemoval(id: string) {
  const refresh = useRefreshAfterWorkout();
  const restore = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST('/api/v1/workouts/{id}/restore', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: refresh,
    onError: (error) => {
      notifyFailure(failureMessage(error, "Couldn't undo. Try again."));
    },
  });

  return (message: string) => {
    notifySuccess(message, {
      label: 'Undo',
      onPress: () => {
        dismissNotification();
        restore.mutate();
      },
    });
  };
}

async function deleteWorkout(id: string) {
  const { response, error } = await api.DELETE('/api/v1/workouts/{id}', {
    params: { path: { id } },
  });
  if (!response.ok) {
    throw toApiError(error);
  }
}

/** Discards a workout, goes back to its day, and offers to undo it. The undo leaves you on the day. */
export function useDiscardWorkout(id: string) {
  const router = useRouter();
  const refresh = useRefreshAfterWorkout();
  const offerUndo = useUndoRemoval(id);

  return useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: async () => {
      router.dismiss(pagesBackToDay);
      offerUndo('Workout discarded.');
      await refresh();
    },
    onError: () => {
      notifyFailure("Couldn't discard the workout. Try again.");
    },
  });
}

/** Deletes a saved workout, so its day shows its plan again, and offers to undo it. */
export function useDeleteWorkout(id: string) {
  const refresh = useRefreshAfterWorkout();
  const offerUndo = useUndoRemoval(id);

  return useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: async () => {
      offerUndo('Workout deleted.');
      await refresh();
    },
    onError: () => {
      notifyFailure("Couldn't delete the workout. Try again.");
    },
  });
}
