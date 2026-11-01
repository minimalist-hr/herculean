import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { ApiProblemError, toApiError } from '@/api/problem';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';

import { useRefreshGroups } from './use-refresh-groups';

interface DeletedGroup {
  id: string;
  name: string;
}

/** The API's own words when they help, or else a general failure. */
function failureOf(error: unknown, general: string) {
  return error instanceof ApiProblemError &&
    (error.problem.code === 'group.in_use' ||
      error.problem.code === 'group.name_taken')
    ? error.problem.detail
    : general;
}

/** Deletes a group and says so, with an Undo that restores it. It runs on after the screen closes. */
export function useDeleteGroup() {
  const refresh = useRefreshGroups();

  const restore = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/groups/{id}/restore', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }
    },
    onSuccess: refresh,
    onError: (error) => {
      notifyFailure(failureOf(error, "Couldn't undo. Try again."));
    },
  });

  return useMutation({
    mutationFn: async ({ id }: DeletedGroup) => {
      const { error, response } = await api.DELETE('/api/v1/groups/{id}', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: async (_data, group) => {
      await refresh();
      notifySuccess(`${group.name} deleted.`, {
        label: 'Undo',
        onPress: () => {
          dismissNotification();
          restore.mutate(group.id);
        },
      });
    },
    onError: (error) => {
      void refresh();
      notifyFailure(failureOf(error, "Couldn't delete the group. Try again."));
    },
  });
}
