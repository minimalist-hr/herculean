import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

export const currentUserKey = ['current-user'] as const;

/** The signed-in user. */
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/users/me');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
