import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// The web has no secure storage, so there values live as long as the page.
const webStored = new Map<string, string>();

/** A value kept on the phone, or null when there is none. */
export async function readStored(key: string) {
  return Platform.OS === 'web'
    ? (webStored.get(key) ?? null)
    : SecureStore.getItemAsync(key);
}

/** Keeps a value on the phone, or removes it with null. */
export async function writeStored(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value === null) {
      webStored.delete(key);
    } else {
      webStored.set(key, value);
    }
  } else if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}
