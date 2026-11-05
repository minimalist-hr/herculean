import {
  adjust,
  afterCheck,
  afterUncheck,
  finish,
  hide,
  restClock,
  show,
  start,
  type Rest,
} from './rest-timer';

const ready: Rest = {
  exerciseId: 'squat',
  seconds: 180,
  endsAt: null,
  open: true,
  hiddenByUser: false,
};

describe('checking a set', () => {
  test('the first check opens it, ready, with the default time', () => {
    expect(afterCheck(null, 'squat', 180)).toEqual(ready);
  });

  test('a changed time stays for the same exercise', () => {
    expect(afterCheck({ ...ready, seconds: 240 }, 'squat', 180).seconds).toBe(
      240,
    );
  });

  test('the next exercise goes back to the default', () => {
    expect(afterCheck({ ...ready, seconds: 240 }, 'press', 180)).toEqual({
      ...ready,
      exerciseId: 'press',
    });
  });

  test('a running timer stops', () => {
    expect(
      afterCheck({ ...ready, endsAt: 5000 }, 'squat', 180).endsAt,
    ).toBeNull();
  });

  test('a bar the user hid stays hidden', () => {
    const rested = afterCheck(hide(ready), 'squat', 180);

    expect(rested.open).toBe(false);
    expect(rested.hiddenByUser).toBe(true);
  });

  test('a bar tucked away by Skip comes back', () => {
    expect(afterCheck(finish(ready), 'squat', 180).open).toBe(true);
  });
});

describe('unchecking a set', () => {
  test('hides a timer not started', () => {
    expect(afterUncheck(ready, true)?.open).toBe(false);
  });

  test('removes it when nothing is checked any more', () => {
    expect(afterUncheck(ready, false)).toBeNull();
  });

  test('leaves a running timer alone', () => {
    const running = { ...ready, endsAt: 5000 };

    expect(afterUncheck(running, false)).toBe(running);
  });

  test('has nothing to do without a timer', () => {
    expect(afterUncheck(null, true)).toBeNull();
  });
});

describe('changing the time', () => {
  test('before starting, within 0:15 and 10:00', () => {
    expect(adjust(ready, 15).seconds).toBe(195);
    expect(adjust({ ...ready, seconds: 15 }, -15).seconds).toBe(15);
    expect(adjust({ ...ready, seconds: 600 }, 15).seconds).toBe(600);
  });

  test('while running changes only this rest', () => {
    const changed = adjust({ ...ready, endsAt: 5000 }, 15);

    expect(changed.endsAt).toBe(20_000);
    expect(changed.seconds).toBe(180);
  });
});

describe('the clock', () => {
  test('shows the time before starting', () => {
    expect(restClock(ready, 0)).toEqual({ phase: 'ready', seconds: 180 });
  });

  test('counts down once started', () => {
    expect(restClock(start(ready, 1000), 7000)).toEqual({
      phase: 'running',
      seconds: 174,
    });
  });

  test('counts up past zero', () => {
    const rest = start(ready, 0);

    expect(restClock(rest, 180_000)).toEqual({ phase: 'over', seconds: 0 });
    expect(restClock(rest, 222_000)).toEqual({ phase: 'over', seconds: 42 });
  });
});

test('Skip or Done stops it and tucks it away, keeping its time', () => {
  expect(finish({ ...ready, seconds: 240, endsAt: 5000 })).toEqual({
    ...ready,
    seconds: 240,
    open: false,
  });
});

test('hiding and showing keep it running', () => {
  const hidden = hide({ ...ready, endsAt: 5000 });

  expect(hidden).toEqual({
    ...ready,
    endsAt: 5000,
    open: false,
    hiddenByUser: true,
  });
  expect(show(hidden)).toEqual({ ...ready, endsAt: 5000 });
});
