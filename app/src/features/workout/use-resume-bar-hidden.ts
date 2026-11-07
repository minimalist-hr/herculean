import { useEffect, useSyncExternalStore } from 'react';

import { readStored, writeStored } from './phone-storage';

const storageKey = 'resumeBarHiddenFor';

/** The workout the bar was hidden for. Undefined until it's read from the phone. */
let hiddenFor: string | null | undefined;
let reading = false;
const listeners = new Set<() => void>();

function set(value: string | null) {
  hiddenFor = value;
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Whether the Resume bar is hidden for a workout, kept on the phone. A new workout shows it again. Undefined while it's read. */
export function useResumeBarHidden(workoutId: string) {
  const stored = useSyncExternalStore(subscribe, () => hiddenFor);

  useEffect(() => {
    if (hiddenFor !== undefined || reading) {
      return;
    }
    reading = true;
    void readStored(storageKey)
      .catch(() => null)
      .then((value) => {
        reading = false;
        set(value ?? null);
      });
  }, []);

  function setHidden(hidden: boolean) {
    const value = hidden ? workoutId : null;
    set(value);
    void writeStored(storageKey, value).catch(() => undefined);
  }

  return {
    hidden: stored === undefined ? undefined : stored === workoutId,
    setHidden,
  };
}
