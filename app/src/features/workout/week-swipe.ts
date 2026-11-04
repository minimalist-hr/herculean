const quickFlick = 0.7;
const changeFraction = 0.25;

/** Which week a swipe ends on: 1 is the next, -1 the previous and 0 stays, after a long swipe or a quick flick. */
export function weekAfterSwipe({
  distance,
  velocity,
  width,
}: {
  /** Positive is to the right, towards the previous week. */
  distance: number;
  velocity: number;
  width: number;
}) {
  const towards = distance < 0 ? 1 : -1;

  if (Math.abs(velocity) > quickFlick) {
    // A flick back against the swipe cancels it.
    return distance * velocity > 0 ? towards : 0;
  }

  return Math.abs(distance) > width * changeFraction ? towards : 0;
}
