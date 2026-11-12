import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { starterKeys } from './query-keys';

export type StarterGroup = components['schemas']['StarterGroupResponse'];

export type StarterExercise = components['schemas']['StarterExerciseResponse'];

export type StarterExerciseDraft =
  components['schemas']['SaveStarterExerciseRequest'];

export const maxStarterExercises = 500;

export const maxStarterGroups = 50;

export function useStarterGroups() {
  return useQuery({
    queryKey: starterKeys.groups,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/starter-groups');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export function useStarterExercises() {
  return useQuery({
    queryKey: starterKeys.exercises,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/starter-exercises');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** Groups count their exercises, so every change reads both again. */
function useStarterMutation<T>(mutationFn: (value: T) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: starterKeys.all }),
  });
}

export function useCreateStarterGroup() {
  return useStarterMutation(async (name: string) => {
    const { data, error } = await api.POST('/api/v1/admin/starter-groups', {
      body: { name },
    });
    if (data === undefined) {
      throw toApiError(error);
    }

    return data;
  });
}

export function useRenameStarterGroup(id: string) {
  return useStarterMutation(async (name: string) => {
    const { error, response } = await api.PUT(
      '/api/v1/admin/starter-groups/{id}',
      { params: { path: { id } }, body: { name } },
    );
    if (!response.ok) {
      throw toApiError(error);
    }
  });
}

export function useDeleteStarterGroup(id: string) {
  return useStarterMutation(async () => {
    const { error, response } = await api.DELETE(
      '/api/v1/admin/starter-groups/{id}',
      { params: { path: { id } } },
    );
    if (!response.ok) {
      throw toApiError(error);
    }
  });
}

export function useCreateStarterExercise() {
  return useStarterMutation(async (draft: StarterExerciseDraft) => {
    const { data, error } = await api.POST('/api/v1/admin/starter-exercises', {
      body: draft,
    });
    if (data === undefined) {
      throw toApiError(error);
    }

    return data;
  });
}

export function useUpdateStarterExercise(id: string) {
  return useStarterMutation(async (draft: StarterExerciseDraft) => {
    const { error, response } = await api.PUT(
      '/api/v1/admin/starter-exercises/{id}',
      { params: { path: { id } }, body: draft },
    );
    if (!response.ok) {
      throw toApiError(error);
    }
  });
}

export function useDeleteStarterExercise(id: string) {
  return useStarterMutation(async () => {
    const { error, response } = await api.DELETE(
      '/api/v1/admin/starter-exercises/{id}',
      { params: { path: { id } } },
    );
    if (!response.ok) {
      throw toApiError(error);
    }
  });
}

/** Whether a starter exercise uses the group, as its group or as also works. */
export function groupInUse(
  exercises: readonly StarterExercise[],
  groupId: string,
) {
  return exercises.some(
    (exercise) =>
      exercise.groupId === groupId ||
      exercise.alsoWorksGroupIds.includes(groupId),
  );
}
