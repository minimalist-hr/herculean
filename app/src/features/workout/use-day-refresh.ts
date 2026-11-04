import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dayKeys } from './query-keys';

/** The current time, and a way to read the days again. It does so on its own when a screen comes back into view or the app wakes up. */
export function useDayRefresh() {
  const [now, setNow] = useState(() => new Date());
  const queryClient = useQueryClient();
  const opened = useRef(false);

  const refresh = useCallback(() => {
    setNow(new Date());
    for (const queryKey of [
      dayKeys.allDay,
      dayKeys.allDays,
      dayKeys.allMonths,
      dayKeys.first,
    ]) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [queryClient]);

  // Coming back may find another date, or changes made on other tabs.
  useFocusEffect(
    useCallback(() => {
      if (opened.current) {
        refresh();
      }
      opened.current = true;
    }, [refresh]),
  );

  // The app can stay open past midnight, with this screen showing.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return { now, refresh };
}
