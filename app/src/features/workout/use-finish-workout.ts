import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { api } from '@/api/client';
import type { components } from '@/api/schema';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  afterSheetsClose,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { exerciseKeys } from '@/features/exercises/query-keys';
import { routineKeys } from '@/features/routines/query-keys';

import { dayDataKeys, workoutKeys } from './query-keys';
import { cancelRestAlert } from './rest-alert';

/** How many pages back the day is, from the finish page: past logging. */
const pagesBackToDay = 2;

const changedByAWorkout = [
  workoutKeys.inProgress,
  ...dayDataKeys,
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

/** Saves a workout with what was checked, then goes back to its day and says so. */
export function useSaveWorkout(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      durationMinutes,
      name,
    }: {
      durationMinutes: number | null;
      name: string;
    }) => {
      const { data, error } = await api.PATCH('/api/v1/workouts/{id}', {
        params: { path: { id } },
        body: { status: 'completed', durationMinutes, name },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (saved) => {
      void cancelRestAlert().catch(() => undefined);
      afterSheetsClose(() => {
        router.dismiss(pagesBackToDay);
      });
      notifySuccess(`${saved.name} saved.`);
      await Promise.all(
        [...changedByAWorkout, workoutKeys.workout(id)].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
    onError: (error) => {
      notifyFailure(
        failureMessage(error, 'Couldn’t save the workout. Try again.'),
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
      notifyFailure(failureMessage(error, 'Couldn’t undo. Try again.'));
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
export function useDiscardWorkout(id: string, name: string) {
  const router = useRouter();
  const refresh = useRefreshAfterWorkout();
  const offerUndo = useUndoRemoval(id);

  return useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: async () => {
      afterSheetsClose(() => {
        router.dismiss(pagesBackToDay);
      });
      offerUndo(`${name} discarded.`);
      await refresh();
    },
    onError: () => {
      notifyFailure('Couldn’t discard the workout. Try again.');
    },
  });
}

/** Deletes a saved workout, so its day shows its plan again, and offers to undo it. */
export function useDeleteWorkout(id: string, name: string) {
  const refresh = useRefreshAfterWorkout();
  const offerUndo = useUndoRemoval(id);

  return useMutation({
    mutationFn: () => deleteWorkout(id),
    onSuccess: async () => {
      offerUndo(`${name} deleted.`);
      await refresh();
    },
    onError: () => {
      notifyFailure('Couldn’t delete the workout. Try again.');
    },
  });
}

type EditedExercise = components['schemas']['EditedWorkoutExercise'];

/** Saves a corrected saved workout, then goes back to its day and says so. */
export function useEditWorkout(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterWorkout();

  return useMutation({
    mutationFn: async (body: {
      exercises: EditedExercise[];
      durationMinutes: number | null;
      name: string;
    }) => {
      const { data, error } = await api.PUT('/api/v1/workouts/{id}', {
        params: { path: { id } },
        body,
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (saved) => {
      router.back();
      notifySuccess(`${saved.name} saved.`);
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
      ]);
    },
    onError: (error) => {
      notifyFailure(
        failureMessage(error, 'Couldn’t save the workout. Try again.'),
      );
    },
  });
}
