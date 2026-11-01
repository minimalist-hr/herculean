import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { useRefreshGroups } from './use-refresh-groups';

/** Renames a group, then refreshes what shows it. */
export function useRenameGroup() {
  const refresh = useRefreshGroups();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await api.PATCH('/api/v1/groups/{id}', {
        params: { path: { id } },
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
