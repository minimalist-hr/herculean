import { useEffect, useState } from 'react';

function secondsSince(startedAtUtc: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAtUtc).getTime()) / 1000),
  );
}

/** The seconds since a workout started, ticking every second. Null when it has no elapsed time, as on a past day. */
export function useElapsed(startedAtUtc: string | null | undefined) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!startedAtUtc) {
      return undefined;
    }

    const timer = setInterval(() => {
      tick((count) => count + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [startedAtUtc]);

  return startedAtUtc ? secondsSince(startedAtUtc) : null;
}
