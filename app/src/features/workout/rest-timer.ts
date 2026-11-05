/** A workout's rest timer. It never starts by itself, and it keeps an end time, so it stays right while the app is closed. */
export interface Rest {
  /** The exercise of the last checked set. A time changed before starting stays for that exercise. */
  exerciseId: string;
  /** The time it starts from. */
  seconds: number;
  /** When it ends once started, in milliseconds. Null until then. */
  endsAt: number | null;
  /** Whether the whole bar shows, or only the small button. */
  open: boolean;
  /** The user hid it, so a checked set doesn't bring it back. */
  hiddenByUser: boolean;
}

const stepSeconds = 15;
const leastSeconds = 15;
const mostSeconds = 600;

export { stepSeconds };

/** A set was checked: a fresh time, ready to start. A running timer stops, because this is a new rest. */
export function afterCheck(
  rest: Rest | null,
  exerciseId: string,
  defaultSeconds: number,
): Rest {
  const hiddenByUser = rest?.hiddenByUser ?? false;

  return {
    exerciseId,
    seconds: rest?.exerciseId === exerciseId ? rest.seconds : defaultSeconds,
    endsAt: null,
    open: !hiddenByUser,
    hiddenByUser,
  };
}

/** A set was unchecked: a timer not started goes away, probably after a mis-tap. A running one keeps going. */
export function afterUncheck(rest: Rest | null, anyChecked: boolean) {
  if (rest?.endsAt !== null) {
    return rest;
  }

  return anyChecked ? { ...rest, open: false } : null;
}

export function start(rest: Rest, now: number): Rest {
  return { ...rest, endsAt: now + rest.seconds * 1000 };
}

/** Before starting, it changes the time, within the limits. While running, it changes only this rest. */
export function adjust(rest: Rest, seconds: number): Rest {
  if (rest.endsAt !== null) {
    return { ...rest, endsAt: rest.endsAt + seconds * 1000 };
  }

  return {
    ...rest,
    seconds: Math.min(
      mostSeconds,
      Math.max(leastSeconds, rest.seconds + seconds),
    ),
  };
}

/** Skip or Done: it stops and tucks away, ready for the next set. */
export function finish(rest: Rest): Rest {
  return { ...rest, endsAt: null, open: false };
}

export function hide(rest: Rest): Rest {
  return { ...rest, open: false, hiddenByUser: true };
}

export function show(rest: Rest): Rest {
  return { ...rest, open: true, hiddenByUser: false };
}

/** What it shows at a moment: its time before starting, the time left, or how long ago it ended. */
export function restClock(rest: Rest, now: number) {
  if (rest.endsAt === null) {
    return { phase: 'ready', seconds: rest.seconds } as const;
  }

  const left = Math.ceil((rest.endsAt - now) / 1000);

  return left > 0
    ? ({ phase: 'running', seconds: left } as const)
    : ({ phase: 'over', seconds: Math.abs(left) } as const);
}
