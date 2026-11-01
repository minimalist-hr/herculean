import { useEffect, useState } from 'react';

/** The value, once it has stopped changing for the given time. */
export function useDebouncedValue<Value>(value: Value, waitMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, waitMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, waitMs]);

  return debounced;
}
