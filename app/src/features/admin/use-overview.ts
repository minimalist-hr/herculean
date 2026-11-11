import { useQuery } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';

export const overviewKeys = {
  all: ['admin', 'overview'] as const,
  users: ['admin', 'overview', 'users'] as const,
  training: ['admin', 'overview', 'training'] as const,
  feedback: ['admin', 'overview', 'feedback'] as const,
};

export function useUserStats() {
  return useQuery({
    queryKey: overviewKeys.users,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/users/stats');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export function useTrainingStats() {
  return useQuery({
    queryKey: overviewKeys.training,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/training/stats');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: overviewKeys.feedback,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/feedback/stats');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}
