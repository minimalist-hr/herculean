import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { exerciseKeys } from '@/features/exercises/query-keys';

import { routineKeys } from './query-keys';
import type { RoutineExerciseDraft } from './routine-draft';

interface UpdateRoutine {
  name: string;
  exercises: RoutineExerciseDraft[];
}

/** Changes a routine, then refreshes everything that shows it. */
export function useUpdateRoutine(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, exercises }: UpdateRoutine) => {
      const { data, error } = await api.PUT('/api/v1/routines/{id}', {
        params: { path: { id } },
        body: {
          name,
          exercises: exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            targetSets: exercise.targetSets,
            targetRepsFrom: exercise.targetRepsFrom,
            targetRepsTo: exercise.targetRepsTo,
          })),
        },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: () =>
      Promise.all(
        [
          routineKeys.all,
          routineKeys.weekPlan,
          routineKeys.details,
          exerciseKeys.details,
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
