import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { blockKeys } from './query-keys';

/** Whether a user is blocked from sending feedback. */
export function useFeedbackBlock(id: string) {
  return useQuery({
    queryKey: blockKeys.user(id),
    queryFn: async () => {
      const { data, error } = await api.GET(
        '/api/v1/admin/users/{id}/feedback-block',
        { params: { path: { id } } },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** Blocks or unblocks a user's feedback. */
export function useSetFeedbackBlock(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blocked: boolean) => {
      const params = { params: { path: { id } } };
      const { error, response } = blocked
        ? await api.PUT('/api/v1/admin/users/{id}/feedback-block', params)
        : await api.DELETE('/api/v1/admin/users/{id}/feedback-block', params);
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: blockKeys.user(id) }),
  });
}
