import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { saveTokens } from './session';
import { enterSignedIn } from './session-flows';

interface SignIn {
  email: string;
  password: string;
}

/** Signs in, then shows setup or the app, depending on whether setup is done. */
export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: SignIn) => {
      const { data, error } = await api.POST('/api/v1/sessions', {
        body: { email, password },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      await saveTokens(data);
      await enterSignedIn();
    },
  });
}
