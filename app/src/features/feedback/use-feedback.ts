import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { deviceInfo } from './device-info';
import { feedbackKeys } from './query-keys';

type Schemas = components['schemas'];

export type TicketType = Schemas['TicketType'];
export type TicketStatus = Schemas['TicketStatus'];
export type TicketListItem = Schemas['TicketListItemResponse'];
export type TicketMessage = Schemas['TicketMessageResponse'];

/** A message as the user writes it: its text and its screenshots as Base64 JPEGs. */
export interface MessageDraft {
  message: string;
  screenshots: string[];
}

export function useTickets() {
  return useQuery({
    queryKey: feedbackKeys.list,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/feedback');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

/** A ticket. Each time it is read, the list reads again, so a changed status shows there too. */
export function useTicket(id: string) {
  const queryClient = useQueryClient();
  const ticket = useQuery({
    queryKey: feedbackKeys.ticket(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/feedback/{id}', {
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
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.list });
    }
  }, [dataUpdatedAt, queryClient]);

  return ticket;
}

/** Whose screens read a thread: the user's own, or the admin's inbox. */
export type ThreadReader = 'user' | 'admin';

async function readScreenshot(
  ticketId: string,
  id: string,
  reader: ThreadReader,
) {
  const params = { params: { path: { id: ticketId, screenshotId: id } } };
  const { data, error } =
    reader === 'admin'
      ? await api.GET(
          '/api/v1/admin/feedback/{id}/screenshots/{screenshotId}',
          params,
        )
      : await api.GET(
          '/api/v1/feedback/{id}/screenshots/{screenshotId}',
          params,
        );
  if (data === undefined) {
    throw toApiError(error);
  }

  return data.image;
}

export function useScreenshot(
  ticketId: string,
  id: string,
  reader: ThreadReader = 'user',
) {
  return useQuery({
    queryKey: [...feedbackKeys.screenshot(ticketId, id), reader],
    // A screenshot never changes.
    staleTime: Infinity,
    queryFn: () => readScreenshot(ticketId, id, reader),
  });
}

/** How many tickets have a reply the user hasn't opened, for the dots on Home and Profile. */
export function useUnreadFeedback() {
  return useQuery({
    queryKey: feedbackKeys.unread,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/feedback/unread');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.count;
    },
  });
}

/** Whether Minimalist blocked the user from sending feedback, so the app says so before they write. */
export function useFeedbackBlocked() {
  return useQuery({
    queryKey: feedbackKeys.block,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/feedback/block');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.blocked;
    },
  });
}

export function useSendFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: MessageDraft & { type: TicketType }) => {
      const { data, error } = await api.POST('/api/v1/feedback', {
        body: { ...feedback, ...deviceInfo() },
      });
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.id;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: feedbackKeys.list }),
  });
}

export function useReply(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reply: MessageDraft) => {
      const { error, response } = await api.POST(
        '/api/v1/feedback/{id}/messages',
        { params: { path: { id } }, body: reply },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: feedbackKeys.ticket(id) }),
        queryClient.invalidateQueries({ queryKey: feedbackKeys.list }),
      ]),
  });
}

export function useMarkRead(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.PUT('/api/v1/feedback/{id}/read', {
        params: { path: { id } },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: feedbackKeys.unread }),
        queryClient.invalidateQueries({ queryKey: feedbackKeys.list }),
      ]),
  });
}
