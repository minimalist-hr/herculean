import { useRouter } from 'expo-router';
import { useCallback } from 'react';

let pending: string | null = null;

/** Opens the Workout tab on a day. Its page picks the day up when it comes into view. */
export function useOpenDay() {
  const router = useRouter();

  return useCallback(
    (date: string) => {
      pending = date;
      router.navigate('/workout');
    },
    [router],
  );
}

/** The day the Workout tab was last opened on, once. */
export function takeOpenedDay() {
  const date = pending;
  pending = null;

  return date;
}
