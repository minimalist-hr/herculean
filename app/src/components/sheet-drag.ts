const quickFlick = 0.5;
const closeFraction = 0.3;

/** Whether a sheet closes when the finger lets go, after a long pull down or a quick flick. */
export function closesAfterDrag({
  height,
  pulledDown,
  velocity,
}: {
  height: number;
  /** How far it was pulled below its height. */
  pulledDown: number;
  /** Positive is down. */
  velocity: number;
}) {
  return (
    pulledDown > 0 &&
    (pulledDown > height * closeFraction || velocity > quickFlick)
  );
}
