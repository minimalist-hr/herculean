import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

export const currentUserKey = ['current-user'] as const;

/**
 * The signed-in user. Off until someone is signed in, when asked.
 * The app only opens once it has the user, so pages need no loading or failed state for it.
 */
export function useCurrentUser({ enabled = true } = {}) {
  return useQuery({
    queryKey: currentUserKey,
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/users/me');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
