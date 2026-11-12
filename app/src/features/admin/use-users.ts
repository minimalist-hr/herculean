import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { inboxKeys, userKeys } from './query-keys';
import { overviewKeys } from './use-overview';

export type UserListItem = components['schemas']['UserListItemResponse'];

export type AdminUser = components['schemas']['AdminUserResponse'];

export type UsersFilter = 'all' | 'deletingSoon';

/** Users, 20 at a time: the newest first, or those waiting for deletion, the soonest first. */
export function useUsers(filter: UsersFilter, search: string) {
  return useInfiniteQuery({
    queryKey: userKeys.list(filter, search),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET('/api/v1/admin/users', {
        params: {
          query: {
            search: search === '' ? undefined : search,
            deletingSoon: filter === 'deletingSoon' ? true : undefined,
            cursor: pageParam,
          },
        },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: userKeys.user(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/users/{id}', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** How many workouts and routines a user has. Counts only. */
export function useUserTraining(id: string) {
  return useQuery({
    queryKey: userKeys.training(id),
    queryFn: async () => {
      const { data, error } = await api.GET(
        '/api/v1/admin/users/{id}/training',
        { params: { path: { id } } },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** A user's photo, read only when they have one: pass null otherwise. */
export function useAdminUserPhoto(id: string | null) {
  return useQuery({
    queryKey: userKeys.photo(id ?? ''),
    enabled: id !== null,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/users/{id}/photo', {
        params: { path: { id: id ?? '' } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** A user's tickets, the latest message first. */
export function useUserTickets(id: string) {
  return useQuery({
    queryKey: inboxKeys.userList(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/feedback', {
        params: { query: { userId: id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export type UserAction =
  | 'removePhoto'
  | 'signOut'
  | 'sendResetLink'
  | 'cancelDeletion'
  | 'closeAccount';

async function run(action: UserAction, id: string) {
  const params = { params: { path: { id } } };
  const { error, response } = await (() => {
    switch (action) {
      case 'signOut':
        return api.POST('/api/v1/admin/users/{id}/sessions/revoke', params);
      case 'sendResetLink':
        return api.POST('/api/v1/admin/users/{id}/password-reset', params);
      case 'removePhoto':
        return api.DELETE('/api/v1/admin/users/{id}/photo', params);
      case 'closeAccount':
        return api.POST('/api/v1/admin/users/{id}/deletion', params);
      case 'cancelDeletion':
        return api.DELETE('/api/v1/admin/users/{id}/deletion', params);
    }
  })();
  if (!response.ok) {
    throw toApiError(error);
  }
}

/** An action on a user's account. Afterwards the user, the list and the Overview read again. */
export function useUserAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: UserAction) => run(action, id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
      ]);
    },
  });
}
