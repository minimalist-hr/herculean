import { renderHook } from '@testing-library/react-native';

import { useBottomRoom } from './tab-bar';

let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, right: 0, bottom: 24, left: 0 }),
}));

test('a page without the tab bar keeps room for the phone’s own buttons', async () => {
  mockPathname = '/workout/log/w1';

  const { result } = await renderHook(() => useBottomRoom());

  expect(result.current).toBe(24);
});

test('a page with the tab bar needs no room, because the tab bar has it', async () => {
  mockPathname = '/exercises/e1';

  const { result } = await renderHook(() => useBottomRoom());

  expect(result.current).toBe(0);
});
