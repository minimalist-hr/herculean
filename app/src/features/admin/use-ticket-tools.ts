import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { inboxKeys } from './query-keys';
import { overviewKeys } from './use-overview';

export type TicketPriority = components['schemas']['TicketPriority'];

export type TicketNote = components['schemas']['TicketNoteResponse'];

/** Sets a ticket's priority. The ticket, the inbox and Overview read again. */
export function useUpdatePriority(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priority: TicketPriority) => {
      const { error, response } = await api.PUT(
        '/api/v1/admin/feedback/{id}/priority',
        { params: { path: { id } }, body: { priority } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
        queryClient.invalidateQueries({ queryKey: overviewKeys.all }),
      ]),
  });
}

export function useAddNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const { error, response } = await api.POST(
        '/api/v1/admin/feedback/{id}/notes',
        { params: { path: { id } }, body: { text } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inboxKeys.ticket(id) }),
  });
}

export function useDeleteNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error, response } = await api.DELETE(
        '/api/v1/admin/feedback/{id}/notes/{noteId}',
        { params: { path: { id, noteId } } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: inboxKeys.ticket(id) }),
  });
}
