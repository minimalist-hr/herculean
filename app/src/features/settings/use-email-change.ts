import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';
import { currentUserKey } from '@/features/account/use-current-user';

type EmailChange = components['schemas']['RequestEmailChangeRequest'];
type PendingEmailChange = components['schemas']['PendingEmailChangeResponse'];

export const pendingEmailChangeKey = ['email-change', 'pending'];

/** The address waiting for its link to be opened. */
export function usePendingEmailChange() {
  return useQuery({
    queryKey: pendingEmailChangeKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/email-changes/pending');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** Asks for a link to the new address. The email stays the same until it is opened. */
export function useRequestEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (change: EmailChange) => {
      const { error, response } = await api.POST('/api/v1/email-changes', {
        body: change,
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: (_, { newEmail }) => {
      queryClient.setQueryData<PendingEmailChange>(pendingEmailChangeKey, {
        newEmail: newEmail.toLowerCase(),
      });
    },
  });
}

/** Sends the link again. A failure means the waiting address may be gone, so it is checked again. */
export function useResendEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.POST(
        '/api/v1/email-changes/resend',
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: pendingEmailChangeKey });
    },
  });
}

/** Makes the new email active with the token from the link. */
export function useConfirmEmailChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { error, response } = await api.POST(
        '/api/v1/email-changes/confirm',
        { body: { token } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: currentUserKey });
      void queryClient.invalidateQueries({ queryKey: pendingEmailChangeKey });
    },
  });
}
