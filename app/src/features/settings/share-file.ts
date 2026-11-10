import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

/** Saves a ZIP in the app's cache, then opens the phone's share sheet with it. */
export async function shareFile(name: string, bytes: Uint8Array<ArrayBuffer>) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(bytes);
  await shareAsync(file.uri, {
    mimeType: 'application/zip',
    UTI: 'public.zip-archive',
    dialogTitle: 'Export data',
  });
}
