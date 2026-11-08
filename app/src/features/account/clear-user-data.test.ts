import { queryClient } from '@/api/query-client';
import { readStored, storedKeys, writeStored } from '@/storage/phone-storage';

import { clearUserData } from './session-flows';

jest.mock('@/api/client', () => ({ api: {}, refreshTokens: jest.fn() }));

jest.mock('expo-secure-store', () => {
  const stored = new Map<string, string>();
  return {
    setItemAsync: (key: string, value: string) =>
      Promise.resolve(void stored.set(key, value)),
    getItemAsync: (key: string) => Promise.resolve(stored.get(key) ?? null),
    deleteItemAsync: (key: string) => Promise.resolve(void stored.delete(key)),
  };
});

test('nothing of the last user stays in the cache or on the phone', async () => {
  queryClient.setQueryData(['workouts'], ['a workout']);
  await Promise.all(
    Object.values(storedKeys).map((key) => writeStored(key, 'saved')),
  );

  clearUserData();

  expect(queryClient.getQueryData(['workouts'])).toBeUndefined();
  await expect(
    Promise.all(Object.values(storedKeys).map((key) => readStored(key))),
  ).resolves.toEqual([null, null, null]);
});
