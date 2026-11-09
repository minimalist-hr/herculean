import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { exerciseKeys } from '@/features/exercises/query-keys';

import type { Weekday } from '@/formats/formats';
import { routineKeys } from './query-keys';
import type { RoutineExerciseDraft } from './routine-draft';

interface CreateRoutine {
  name: string;
  weekdays: Weekday[];
  exercises: RoutineExerciseDraft[];
}

/** Creates a routine, then refreshes the routine list and the exercises it uses. */
export function useCreateRoutine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, weekdays, exercises }: CreateRoutine) => {
      const { data, error } = await api.POST('/api/v1/routines', {
        body: {
          name,
          weekdays,
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
