import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { routineKeys } from './query-keys';
import type { RoutineExerciseDraft } from './routine-draft';

interface CreateRoutine {
  name: string;
  exercises: RoutineExerciseDraft[];
}

/** Creates a routine, then refreshes the routine list. */
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, exercises }: CreateRoutine) => {
      const { data, error } = await api.POST('/api/v1/routines', {
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
      queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  });
}
