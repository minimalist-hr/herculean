import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';
import type { StatusFilter } from '@/features/feedback/status-chips';
import type { MessageDraft } from '@/features/feedback/use-feedback';

import { inboxKeys } from './query-keys';

export type InboxTicket = components['schemas']['InboxTicketListItemResponse'];

export type InboxFilter = StatusFilter;

export function useInbox(filter: InboxFilter) {
  return useQuery({
    queryKey: inboxKeys.list(filter),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/feedback', {
        params: { query: filter === 'all' ? {} : { status: filter } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** A ticket. Each time it is read, the inbox reads again, so a changed status shows there too. */
export function useInboxTicket(id: string) {
  const queryClient = useQueryClient();
  const ticket = useQuery({
    queryKey: inboxKeys.ticket(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/feedback/{id}', {
        params: { path: { id } },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
  const { dataUpdatedAt } = ticket;

  useEffect(() => {
    if (dataUpdatedAt > 0) {
      void queryClient.invalidateQueries({
        queryKey: [...inboxKeys.all, 'list'],
      });
    }
  }, [dataUpdatedAt, queryClient]);

  return ticket;
}

export function useAdminReply(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reply: MessageDraft) => {
      const { error, response } = await api.POST(
        '/api/v1/admin/feedback/{id}/messages',
        { params: { path: { id } }, body: reply },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
  });
}

export function useUpdateTicketStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: 'open' | 'closed') => {
      const { error, response } = await api.PUT(
        '/api/v1/admin/feedback/{id}/status',
        { params: { path: { id } }, body: { status } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
  });
}
