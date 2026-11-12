import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

import { savedReplyKeys } from './query-keys';

export type SavedReply = components['schemas']['SavedReplyResponse'];

export interface SavedReplyDraft {
  title: string;
  text: string;
}

export const titleMaxLength = 50;

export const textMaxLength = 2000;

/** What a saved reply's text reads as for a user: {name} becomes their name, or "there" without one. */
export function fillName(text: string, name: string | null) {
  return text.replaceAll('{name}', name ?? 'there');
}

export function useSavedReplies() {
  return useQuery({
    queryKey: savedReplyKeys.all,
    queryFn: async () => {
      const { data, error } = await api.GET(
        '/api/v1/admin/feedback/saved-replies',
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export function useCreateSavedReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: SavedReplyDraft) => {
      const { data, error } = await api.POST(
        '/api/v1/admin/feedback/saved-replies',
        { body: draft },
      );
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: savedReplyKeys.all }),
  });
}

export function useUpdateSavedReply(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: SavedReplyDraft) => {
      const { error, response } = await api.PUT(
        '/api/v1/admin/feedback/saved-replies/{id}',
        { params: { path: { id } }, body: draft },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: savedReplyKeys.all }),
  });
}

export function useDeleteSavedReply(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.DELETE(
        '/api/v1/admin/feedback/saved-replies/{id}',
        { params: { path: { id } } },
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: savedReplyKeys.all }),
  });
}
