import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';

type UserPhoto = components['schemas']['UserPhotoResponse'];

export const userPhotoKey = ['user', 'photo'];

/** Which save the avatar waits for, while a photo uploads. */
export const savePhotoKey = ['user', 'photo', 'save'];

/** What an image can show, from the photo as the API sends it. */
export function photoUri(image: string) {
  return `data:image/jpeg;base64,${image}`;
}

export function useUserPhoto() {
  return useQuery({
    queryKey: userPhotoKey,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/users/me/photo');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data;
    },
  });
}

export function useSaveUserPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: savePhotoKey,
    mutationFn: async (image: string) => {
      const { error, response } = await api.PUT('/api/v1/users/me/photo', {
        body: { image },
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: (_, image) => {
      queryClient.setQueryData<UserPhoto>(userPhotoKey, { image });
    },
  });
}

export function useRemoveUserPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.DELETE('/api/v1/users/me/photo');
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData<UserPhoto>(userPhotoKey, { image: null });
    },
  });
}
