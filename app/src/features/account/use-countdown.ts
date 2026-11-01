import { useEffect, useState } from 'react';

const secondMs = 1000;

/** Counts down from the given seconds, and from there again on restart. It follows the clock, so it keeps time while the app is in the background. */
export function useCountdown(seconds: number) {
  const [endsAtMs, setEndsAtMs] = useState(
    () => Date.now() + seconds * secondMs,
  );
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAtMs - Date.now()) / secondMs));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(timer);
      }
    }, secondMs);

    return () => {
      clearInterval(timer);
    };
  }, [endsAtMs]);

  function restart() {
    setEndsAtMs(Date.now() + seconds * secondMs);
    setSecondsLeft(seconds);
  }

  return { secondsLeft, restart };
}
