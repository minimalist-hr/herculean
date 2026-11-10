import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme/theme-provider';

import { InTabsContext, setFloatingRoom, usePageEnd } from './above-tab-bar';

let mockPathname = '/';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, right: 0, bottom: 24, left: 0 }),
}));

function InTabs({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme="dark">
      <InTabsContext.Provider value>{children}</InTabsContext.Provider>
    </ThemeProvider>
  );
}

beforeEach(() => {
  setFloatingRoom(0);
});

test('a tab’s first page ends 24 px after its content', async () => {
  mockPathname = '/exercises';

  const { result } = await renderHook(() => usePageEnd(), { wrapper: InTabs });

  expect(result.current).toBe(24);
});

test('with a bar showing, a page ends 12 px above it', async () => {
  mockPathname = '/exercises';
  setFloatingRoom(72);

  const { result } = await renderHook(() => usePageEnd(), { wrapper: InTabs });

  expect(result.current).toBe(84);
});

test('a page without the tab bar keeps room for the phone’s own buttons', async () => {
  mockPathname = '/exercises/e1';
  setFloatingRoom(72);

  const { result } = await renderHook(() => usePageEnd(), { wrapper: InTabs });

  expect(result.current).toBe(48);
});

test('a page with its own bar ends 12 px above it, over the phone’s buttons', async () => {
  mockPathname = '/workout/log/w1';

  const { result } = await renderHook(() => usePageEnd(72), {
    wrapper: InTabs,
  });

  expect(result.current).toBe(108);
});
