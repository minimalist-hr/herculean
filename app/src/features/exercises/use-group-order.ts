import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';
import { notifyFailure } from '@/components/notifications';

import { exerciseKeys } from './query-keys';
import { useRefreshGroups } from './use-refresh-groups';

type Group = components['schemas']['GroupListItemResponse'];

/** Shows a new order at once and saves it. If that fails, the saved order comes back. */
export function useGroupOrder() {
  const queryClient = useQueryClient();
  const refresh = useRefreshGroups();
  const { mutate } = useMutation({
    mutationFn: async (groupIds: string[]) => {
      const { error, response } = await api.PUT('/api/v1/group-order', {
        body: { groupIds },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onError: () => {
      notifyFailure("Couldn't save the order. Try again.");
    },
    onSettled: refresh,
  });

  return (groups: Group[]) => {
    queryClient.setQueryData(exerciseKeys.groups, groups);
    mutate(groups.map((group) => group.id));
  };
}
