import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Rest } from './rest-timer';

const storageKey = 'restTimer';

// The web has no secure storage, so there it lives as long as the page.
let webStored: string | null = null;

async function read() {
  return Platform.OS === 'web'
    ? webStored
    : SecureStore.getItemAsync(storageKey);
}

async function write(value: string | null) {
  if (Platform.OS === 'web') {
    webStored = value;
  } else if (value === null) {
    await SecureStore.deleteItemAsync(storageKey);
  } else {
    await SecureStore.setItemAsync(storageKey, value);
  }
}

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
    void read()
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
      void write(
        rest === null ? null : JSON.stringify({ workoutId, rest }),
      ).catch(() => undefined);
    }
  }, [loaded, rest, workoutId]);

  const update = useCallback((change: (rest: Rest | null) => Rest | null) => {
    setRest(change);
  }, []);

  return { rest, update };
}
