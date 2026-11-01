import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

interface SaveNewPassword {
  token: string;
  password: string;
}

/** Sets the new password with the token from the reset link. */
export function useSaveNewPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: SaveNewPassword) => {
      const { error, response } = await api.POST(
        '/api/v1/password-resets/complete',
        { body: { token, password } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
  });
}
