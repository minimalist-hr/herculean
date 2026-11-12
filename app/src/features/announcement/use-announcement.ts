import { useEffect, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import type { components } from '@/api/schema';
import { readStored, storedKeys, writeStored } from '@/storage/phone-storage';

export type Announcement = components['schemas']['AnnouncementResponse'];

export interface AnnouncementDraft {
  title: string;
  text: string;
}

export const titleMaxLength = 60;

export const textMaxLength = 300;

export const announcementKeys = {
  all: ['announcement'] as const,
  current: ['announcement', 'current'] as const,
  admin: ['announcement', 'admin'] as const,
};

/** The announcement on Home, or null without one. */
export function useAnnouncement() {
  return useQuery({
    queryKey: announcementKeys.current,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/announcement');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.announcement ?? null;
    },
  });
}

/** The announcement an admin edits, or null without one. */
export function useAdminAnnouncement() {
  return useQuery({
    queryKey: announcementKeys.admin,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/admin/announcement');
      if (data === undefined) {
        throw toApiError(error);
      }

      return data.announcement ?? null;
    },
  });
}

export function useSaveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: AnnouncementDraft) => {
      const { error, response } = await api.PUT('/api/v1/admin/announcement', {
        body: draft,
      });
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

export function useRemoveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.DELETE(
        '/api/v1/admin/announcement',
      );
      if (!response.ok) {
        throw toApiError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}

const dayMs = 24 * 60 * 60 * 1000;

/** How long an announcement has been on, for example "On · 3 days", or "Off" without one. */
export function announcementStatus(
  announcement: Announcement | null,
  now: Date,
) {
  if (announcement === null) {
    return 'Off';
  }

  const days = Math.floor(
    (now.getTime() - new Date(announcement.publishedAtUtc).getTime()) / dayMs,
  );
  if (days < 1) {
    return 'On · today';
  }

  return days === 1 ? 'On · 1 day' : `On · ${String(days)} days`;
}

/** The announcement this phone closed. Undefined until it's read from the phone. */
let closedId: string | null | undefined;
let reading = false;
const listeners = new Set<() => void>();

function setClosed(value: string | null) {
  closedId = value;
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Which announcement this phone closed, kept on the phone. A new announcement shows again. */
export function useClosedAnnouncement() {
  const stored = useSyncExternalStore(subscribe, () => closedId);

  useEffect(() => {
    if (closedId !== undefined || reading) {
      return;
    }
    reading = true;
    void readStored(storedKeys.closedAnnouncement)
      .catch(() => null)
      .then((value) => {
        reading = false;
        setClosed(value ?? null);
      });
  }, []);

  return {
    /** Undefined while it's read. */
    closedId: stored,
    close: (id: string) => {
      setClosed(id);
      void writeStored(storedKeys.closedAnnouncement, id).catch(
        () => undefined,
      );
    },
  };
}

/** For tests: forget what the phone closed. */
export function forgetClosedAnnouncement() {
  closedId = undefined;
  reading = false;
}
