import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { useRefreshGroups } from './use-refresh-groups';

/** Adds a group, then refreshes what shows it. */
export function useCreateGroup() {
  const refresh = useRefreshGroups();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await api.POST('/api/v1/groups', {
        body: { name },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: refresh,
  });
}
