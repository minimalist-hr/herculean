import { fireEvent } from '@testing-library/react-native';

type Element = Parameters<typeof fireEvent>[0];

let clock = 1000;

function touch(
  startY: number,
  previousY: number,
  y: number,
  startedAt: number,
  axis: 'x' | 'y',
) {
  const across = axis === 'y' ? 0 : 500;
  const at = (position: number) =>
    axis === 'y'
      ? { pageX: across, pageY: position }
      : { pageX: position, pageY: across };

  const previousAt = clock;
  clock += 16;

  return {
    nativeEvent: { touches: [{}], changedTouches: [{}], timestamp: clock },
    touchHistory: {
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: clock,
      numberActiveTouches: 1,
      touchBank: [
        {
          touchActive: true,
          startPageX: at(startY).pageX,
          startPageY: at(startY).pageY,
          startTimeStamp: startedAt,
          currentPageX: at(y).pageX,
          currentPageY: at(y).pageY,
          currentTimeStamp: clock,
          previousPageX: at(previousY).pageX,
          previousPageY: at(previousY).pageY,
          previousTimeStamp: previousAt,
        },
      ],
    },
  };
}

/** Moves a finger on a view with PanResponder handlers: down, along in steps, then up. */
export async function dragBy(
  element: Element,
  distance: number,
  steps = 4,
  axis: 'x' | 'y' = 'y',
) {
  const startedAt = clock;
  const startY = 500;
  await fireEvent(
    element,
    'responderGrant',
    touch(startY, startY, startY, startedAt, axis),
  );

  let y = startY;
  for (let step = 1; step <= steps; step += 1) {
    const next = startY + (distance * step) / steps;
    await fireEvent(
      element,
      'responderMove',
      touch(startY, y, next, startedAt, axis),
    );
    y = next;
  }

  await fireEvent(
    element,
    'responderRelease',
    touch(startY, y, y, startedAt, axis),
  );
}
