import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, refreshTokens } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure } from '@/components/notifications';
import type { components } from '@/api/schema';
import { endSession, readRefreshToken } from '@/features/account/session';
import { currentUserKey } from '@/features/account/use-current-user';
import { workoutKeys } from '@/features/workout/query-keys';

type WorkoutSettings = components['schemas']['WorkoutSettingsResponse'];

type UserChanges = components['schemas']['UpdateCurrentUserRequest'];
type PasswordChange = Omit<
  components['schemas']['ChangePasswordRequest'],
  'refreshToken'
>;

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

/** Changes the password. This device stays signed in, and every other one is signed out. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (change: PasswordChange) => {
      // With fresh tokens the request can't expire and be retried with a refresh token that was replaced, which would sign this device out too.
      if (!(await refreshTokens())) {
        await endSession();
        throw new Error('The session has ended.');
      }

      const { error, response } = await api.PUT('/api/v1/users/me/password', {
        body: { ...change, refreshToken: (await readRefreshToken()) ?? '' },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
  });
}

/** Saves the default rest time. */
interface RestAlerts {
  restSound?: boolean;
  restVibrate?: boolean;
}

/** Turns a rest alert on or off at once, and puts it back if saving fails. */
export function useUpdateRestAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (change: RestAlerts) => {
      const { data, error } = await api.PATCH('/api/v1/workout-settings', {
        body: change,
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onMutate: (change) => {
      const before = queryClient.getQueryData<WorkoutSettings>(
        workoutKeys.settings,
      );
      if (before !== undefined) {
        queryClient.setQueryData(workoutKeys.settings, {
          ...before,
          ...change,
        });
      }

      return { before };
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(workoutKeys.settings, settings);
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(workoutKeys.settings, context?.before);
      notifyFailure('Couldn’t save the setting. Try again.');
    },
  });
}

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
