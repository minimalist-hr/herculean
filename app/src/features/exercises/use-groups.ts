import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

import { exerciseKeys } from './query-keys';

/** The groups in their order. */
export function useGroups() {
  return useQuery({
    queryKey: exerciseKeys.groups,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/groups');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** Why a new exercise can't be created yet. */
export const noGroupsMessage = 'Create a group first.';
