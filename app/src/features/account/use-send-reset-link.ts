import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

/** Asks for a reset link. The API answers the same whether or not the email has an account. */
export function useSendResetLink() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error, response } = await api.POST('/api/v1/password-resets', {
        body: { email },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
  });
}
