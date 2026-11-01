import { useMutation } from '@tanstack/react-query';
import { getCalendars } from 'expo-localization';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { enterApp, saveTokens } from './session';

interface CreateAccount {
  email: string;
  password: string;
}

/** Creates the account with the phone's time zone, then signs it in. */
export function useCreateAccount() {
  return useMutation({
    mutationFn: async ({ email, password }: CreateAccount) => {
      const { data, error } = await api.POST('/api/v1/users', {
        body: { email, password, timeZone: phoneTimeZone() },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      await saveTokens(data);
      // A new account has no name yet, so it goes to setup.
      enterApp(false);
    },
  });
}

// The API keeps the user's time zone for dates and days. UTC only if the phone has none.
function phoneTimeZone() {
  return getCalendars().at(0)?.timeZone ?? 'UTC';
}
