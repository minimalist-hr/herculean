import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dateText } from '@/formats/dates';

import { dayDataKeys } from './query-keys';

/** The current time, and a way to read the days again. It does so on its own when the app wakes up, or a screen comes back on another date. */
export function useDayRefresh() {
  const [now, setNow] = useState(() => new Date());
  const queryClient = useQueryClient();
  const opened = useRef(false);
  const refreshedOn = useRef(dateText(now));

  const refresh = useCallback(() => {
    const current = new Date();
    refreshedOn.current = dateText(current);
    setNow(current);

    return Promise.all(
      dayDataKeys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  }, [queryClient]);

  // Changes made in the app refresh what they change, so coming back only needs another date.
  useFocusEffect(
    useCallback(() => {
      if (opened.current) {
        const current = new Date();
        if (dateText(current) === refreshedOn.current) {
          setNow(current);
        } else {
          void refresh();
        }
      }
      opened.current = true;
    }, [refresh]),
  );

  // The app can stay open past midnight, with this screen showing.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return { now, refresh };
}
