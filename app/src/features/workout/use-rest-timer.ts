import { useCallback, useEffect, useState } from 'react';

import { readStored, writeStored } from '@/storage/phone-storage';
import type { Rest } from './rest-timer';

const storageKey = 'restTimer';

function restOf(stored: string | null | undefined, workoutId: string) {
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as { workoutId: string; rest: Rest };

    return parsed.workoutId === workoutId ? parsed.rest : null;
  } catch {
    return null;
  }
}

/** A workout's rest timer, kept on the phone so it survives closing the app. */
export function useRestTimer(workoutId: string) {
  const [rest, setRest] = useState<Rest | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let current = true;
    void readStored(storageKey)
      .catch(() => null)
      .then((stored) => {
        if (current) {
          setRest(restOf(stored, workoutId));
          setLoaded(true);
        }
      });

    return () => {
      current = false;
    };
  }, [workoutId]);

  useEffect(() => {
    if (loaded) {
      void writeStored(
        storageKey,
        rest === null ? null : JSON.stringify({ workoutId, rest }),
      ).catch(() => undefined);
    }
  }, [loaded, rest, workoutId]);

  const update = useCallback((change: (rest: Rest | null) => Rest | null) => {
    setRest(change);
  }, []);

  return { rest, update };
}
