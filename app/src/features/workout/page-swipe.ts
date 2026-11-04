const quickFlick = 0.7;
const changeFraction = 0.25;
const startsAfter = 16;
const sidewaysRatio = 2;

/** Whether a move is clearly sideways, so that scrolling up or down never turns into a swipe. */
export function isSidewaysSwipe(dx: number, dy: number) {
  return (
    Math.abs(dx) > startsAfter && Math.abs(dx) > Math.abs(dy) * sidewaysRatio
  );
}

/** Which page a swipe ends on: 1 is the next, -1 the previous and 0 stays, after a long swipe or a quick flick. */
export function pageAfterSwipe({
  distance,
  velocity,
  width,
}: {
  /** Positive is to the right, towards the previous page. */
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
