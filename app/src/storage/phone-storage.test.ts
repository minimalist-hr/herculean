import { Platform } from 'react-native';

import { readStored, writeStored } from './phone-storage';

jest.mock('expo-secure-store', () => {
  const stored = new Map<string, string>();
  return {
    setItemAsync: jest.fn((key: string, value: string) =>
      Promise.resolve(void stored.set(key, value)),
    ),
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(stored.get(key) ?? null),
    ),
    deleteItemAsync: jest.fn((key: string) =>
      Promise.resolve(void stored.delete(key)),
    ),
  };
});

afterEach(() => {
  Platform.OS = 'ios';
});

test.each(['ios', 'web'] as const)(
  'on %s a value is kept, read back and removed',
  async (os) => {
    Platform.OS = os;

    expect(await readStored('key')).toBeNull();

    await writeStored('key', 'value');
    expect(await readStored('key')).toBe('value');

    await writeStored('key', null);
    expect(await readStored('key')).toBeNull();
  },
);
