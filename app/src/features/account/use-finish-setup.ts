import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { enterApp } from './session';
import { currentUserKey } from './use-current-user';

type Units = components['schemas']['Units'];

interface FinishSetup {
  name: string;
  units: Units;
  defaultRestSeconds: number;
}

/** Saves the name, units and default rest time. Both changes can be sent again safely. */
export function useFinishSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, units, defaultRestSeconds }: FinishSetup) => {
      const [user, workoutSettings] = await Promise.all([
        api.PATCH('/api/v1/users/me', { body: { name, units } }),
        api.PATCH('/api/v1/workout-settings', { body: { defaultRestSeconds } }),
      ]);
      if (user.data === undefined) {
        throw toApiError(user.error);
      }
      if (workoutSettings.data === undefined) {
        throw toApiError(workoutSettings.error);
      }

      // Kept for the first screen, which then knows the units and the name.
      queryClient.setQueryData(currentUserKey, user.data);
      enterApp(true);
    },
  });
}
