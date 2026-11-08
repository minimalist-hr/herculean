import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';
import { currentUserKey } from '@/features/account/use-current-user';
import { workoutKeys } from '@/features/workout/query-keys';

type UserChanges = components['schemas']['UpdateCurrentUserRequest'];

/** Saves the user's theme, color or units, and shows them everywhere at once. */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changes: UserChanges) => {
      const { data, error } = await api.PATCH('/api/v1/users/me', {
        body: changes,
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserKey, user);
    },
  });
}

/** Saves the default rest time. */
export function useUpdateDefaultRest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (defaultRestSeconds: number) => {
      const { data, error } = await api.PATCH('/api/v1/workout-settings', {
        body: { defaultRestSeconds },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(workoutKeys.settings, settings);
    },
  });
}
