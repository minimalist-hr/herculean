import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { dayKeys } from '@/features/workout/query-keys';

import { phoneTimeZone } from './phone-time-zone';
import { currentUserKey, useCurrentUser } from './use-current-user';

/** Keeps the stored time zone the phone's, so the server and the phone agree on today. It checks when the app opens and wakes up. */
export function useKeepTimeZone() {
  const queryClient = useQueryClient();
  const stored = useCurrentUser().data?.timeZone;
  const [phone, setPhone] = useState(phoneTimeZone);
  const { mutate, isPending } = useMutation({
    mutationFn: async (timeZone: string) => {
      const { data, error } = await api.PATCH('/api/v1/users/me', {
        body: { timeZone },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: async (user) => {
      queryClient.setQueryData(currentUserKey, user);
      // Days use the stored zone, so today may now be another date.
      await Promise.all(
        [dayKeys.allDay, dayKeys.allDays, dayKeys.allMonths].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setPhone(phoneTimeZone());
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // A failure is tried again the next time the app wakes up in another zone.
  useEffect(() => {
    if (stored !== undefined && stored !== phone && !isPending) {
      mutate(phone);
    }
  }, [isPending, mutate, phone, stored]);
}
