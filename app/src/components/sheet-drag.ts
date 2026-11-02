const quickFlick = 0.5;
const closeFraction = 0.3;

interface DragEnd {
  /** The height it opens at. */
  rest: number;
  /** The height it can be pulled up to. The same as rest when the content fits. */
  full: number;
  height: number;
  /** How far it was pulled below its resting height. */
  pulledDown: number;
  /** Positive is down. */
  velocity: number;
}

/** Where a sheet goes when the finger lets go. */
export function snapAfterDrag({
  rest,
  full,
  height,
  pulledDown,
  velocity,
}: DragEnd) {
  if (pulledDown > 0) {
    return pulledDown > rest * closeFraction || velocity > quickFlick
      ? 'close'
      : 'rest';
  }
  if (full <= rest) {
    return 'rest';
  }
  if (velocity < -quickFlick) {
    return 'full';
  }
  if (velocity > quickFlick) {
    return 'rest';
  }

  return height > (rest + full) / 2 ? 'full' : 'rest';
}
