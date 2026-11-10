import { useMutation } from '@tanstack/react-query';

import { api } from '@/api/client';
import { toApiError } from '@/api/problem';
import { notifyFailure, notifySuccess } from '@/components/notifications';

import { exportFileName, exportZip } from './export-data';
import { shareFile } from './share-file';

async function readExport() {
  const { data, error } = await api.GET('/api/v1/export');
  if (data === undefined) {
    throw toApiError(error);
  }

  return data;
}

async function readUser() {
  const { data, error } = await api.GET('/api/v1/users/me');
  if (data === undefined) {
    throw toApiError(error);
  }

  return data;
}

async function readSettings() {
  const { data, error } = await api.GET('/api/v1/workout-settings');
  if (data === undefined) {
    throw toApiError(error);
  }

  return data;
}

async function readPhoto() {
  const { data, error } = await api.GET('/api/v1/users/me/photo');
  if (data === undefined) {
    throw toApiError(error);
  }

  return data.image ?? null;
}

/** Reads all of the user's data, zips it as CSV files and shares the ZIP. */
export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const [data, user, settings, photo] = await Promise.all([
        readExport(),
        readUser(),
        readSettings(),
        readPhoto(),
      ]);
      await shareFile(
        exportFileName(new Date()),
        exportZip({ data, user, settings, photo }),
      );
    },
    onSuccess: () => {
      notifySuccess('Data exported.');
    },
    onError: () => {
      notifyFailure('Couldn’t export your data. Try again.');
    },
  });
}
