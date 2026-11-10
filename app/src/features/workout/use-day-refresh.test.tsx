import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createTestQueryClient } from '@/test-utils/query-client';

import { useDayRefresh } from './use-day-refresh';

let focus: () => void;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void) => {
    focus = effect;
    jest
      .requireActual<typeof import('react')>('react')
      .useEffect(effect, [effect]);
  },
}));

async function renderRefresh() {
  const client = createTestQueryClient();
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useDayRefresh(), { wrapper });

  return { invalidate, result };
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 10, 18, 0) });
});

afterEach(() => {
  jest.useRealTimers();
});

test('coming back on the same day reads nothing again, and updates the time', async () => {
  const { invalidate, result } = await renderRefresh();

  jest.setSystemTime(new Date(2026, 10, 10, 19, 30));
  await act(() => {
    focus();
  });

  expect(invalidate).not.toHaveBeenCalled();
  expect(result.current.now.getHours()).toBe(19);
});

test('coming back on another date reads the days again', async () => {
  const { invalidate, result } = await renderRefresh();

  jest.setSystemTime(new Date(2026, 10, 11, 0, 5));
  await act(() => {
    focus();
  });

  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['streak'] });
  expect(result.current.now.getDate()).toBe(11);
});
