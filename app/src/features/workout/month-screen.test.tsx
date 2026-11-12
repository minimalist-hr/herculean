import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { AccessibilityInfo } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { dragBy } from '@/test-utils/drag';
import { ThemeProvider } from '@/theme/theme-provider';

import { MonthScreen } from './month-screen';
import { WorkoutScreen } from './workout-screen';
import { createTestQueryClient } from '@/test-utils/query-client';

const darkColors = {
  danger: '#F87171',
  muted: '#A9AEB6',
  onPrimary: '#FFFFFF',
  primary: '#2A62F0',
  skipped: '#FB923C',
};

const mockFetch = jest.fn<Promise<Response>, [Request]>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
  };
});

const summary = {
  done: 13,
  missed: 1,
  skipped: 1,
  minutesTrained: 770,
  setsDone: 201,
  setsPlanned: 228,
  volumeKg: 98400,
  plannedDays: 15,
  consistencyPercent: 87,
};

const legs = {
  id: 'legs',
  name: 'Legs',
  exercises: [
    {
      exerciseId: 'squat',
      name: 'Barbell squat',
      groupId: 'legs-group',
      groupName: 'Legs',
      targetSets: 3,
      targetRepsFrom: 8,
      targetRepsTo: 10,
    },
  ],
};

const statuses: Record<string, { status: string; routineName: string | null }> =
  {
    '2026-11-01': { status: 'completed', routineName: 'Legs' },
    '2026-11-02': { status: 'missed', routineName: 'Legs' },
    '2026-11-03': { status: 'planned', routineName: 'Legs' },
    '2026-11-04': { status: 'rest', routineName: null },
    '2026-11-05': { status: 'skipped', routineName: 'Legs' },
    '2026-11-06': { status: 'planned', routineName: 'Legs' },
  };

function dayFor(date: string) {
  const day = statuses[date] ?? { status: 'rest', routineName: null };

  return {
    date,
    status: day.status,
    hasRoutines: true,
    workoutId: null,
    routine: day.routineName === null ? null : legs,
    upNext: { date: '2026-11-07', routineName: null },
  };
}

function answer({
  monthSummary = summary,
  first = '2026-01-01',
  failing = '',
  calendarFails = false,
  units = 'metric',
}: {
  monthSummary?: unknown;
  first?: string;
  failing?: string;
  calendarFails?: boolean;
  units?: string;
} = {}) {
  mockFetch.mockImplementation((request) => {
    const url = new URL(request.url);
    const path = url.pathname;
    if (failing !== '' && path.includes(failing)) {
      return Promise.resolve(Response.json({ status: 500 }, { status: 500 }));
    }
    if (calendarFails && path === '/api/v1/days') {
      return Promise.resolve(Response.json({ status: 500 }, { status: 500 }));
    }
    if (path === '/api/v1/days') {
      const from = url.searchParams.get('from') ?? '';
      const to = url.searchParams.get('to') ?? '';

      return Promise.resolve(
        Response.json(
          Object.entries(statuses)
            .filter(([date]) => date >= from && date <= to)
            .map(([date, day]) => ({ date, ...day })),
        ),
      );
    }
    if (path === '/api/v1/users/me') {
      return Promise.resolve(Response.json({ units }));
    }
    if (path === '/api/v1/days/first') {
      return Promise.resolve(Response.json({ date: first }));
    }
    if (path.startsWith('/api/v1/month-summaries/')) {
      return Promise.resolve(Response.json(monthSummary));
    }

    return Promise.resolve(Response.json(dayFor(path.split('/').pop() ?? '')));
  });
}

function requested() {
  return mockFetch.mock.calls.map(([request]) => new URL(request.url).pathname);
}

function Layout() {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderMonth() {
  await renderRouter(
    {
      _layout: Layout,
      'workout/index': () => <WorkoutScreen />,
      'workout/month': () => <MonthScreen />,
    },
    { initialUrl: '/workout' },
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Month' }));
  await screen.findByText('November');
}

const dayButton = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  mockFetch.mockReset();
  // Tuesday 3 November 2026. Only the date is fixed: timers run as usual.
  jest.useFakeTimers({
    now: new Date(2026, 10, 3, 18),
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
  // The clock is fixed, so a slide with a duration would never finish.
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('totals', () => {
  test('shows the counts and totals', async () => {
    answer();
    await renderMonth();

    expect(await screen.findByText('12 h 50 min')).toBeOnTheScreen();
    expect(screen.getAllByText('13')).toHaveLength(2);
    expect(screen.getByText('November totals')).toBeOnTheScreen();
    expect(screen.getByText('About 59 min a workout')).toBeOnTheScreen();
    expect(screen.getByText('201')).toBeOnTheScreen();
    expect(screen.getByText('Of 228 planned')).toBeOnTheScreen();
    expect(screen.getByText('98,400 kg')).toBeOnTheScreen();
    expect(screen.getByText('87%')).toBeOnTheScreen();
    expect(screen.getByText('13 of 15 planned workouts')).toBeOnTheScreen();
  });

  test('volume follows the units setting', async () => {
    answer({ units: 'imperial' });
    await renderMonth();

    expect(await screen.findByText('216,935 lb')).toBeOnTheScreen();
  });

  test('with nothing planned yet, consistency shows a dash', async () => {
    answer({
      monthSummary: {
        ...summary,
        done: 0,
        minutesTrained: 45,
        setsPlanned: 0,
        plannedDays: 0,
        consistencyPercent: null,
      },
    });
    await renderMonth();

    expect(await screen.findByText('–')).toBeOnTheScreen();
    expect(screen.getByText('45 min')).toBeOnTheScreen();
    expect(screen.getByText('No workouts yet')).toBeOnTheScreen();
    expect(screen.getByText('No planned workouts yet')).toBeOnTheScreen();
    expect(screen.getByText('No planned sets yet')).toBeOnTheScreen();
  });

  test('while loading, the labels and dates still show', async () => {
    answer();
    mockFetch.mockImplementation(() => new Promise(() => undefined));
    await renderRouter(
      { _layout: Layout, index: () => <MonthScreen /> },
      { initialUrl: '/' },
    );

    expect(await screen.findByText('Time trained')).toBeOnTheScreen();
    expect(screen.queryByText('Of 228 planned')).toBeNull();
    expect(dayButton('3 November, today')).toBeTruthy();
  });

  async function renderOnlyMonth() {
    await renderRouter(
      { _layout: Layout, index: () => <MonthScreen /> },
      { initialUrl: '/' },
    );
  }

  async function tryAgain() {
    for (const link of screen.getAllByRole('link', { name: 'Try again' })) {
      await fireEvent.press(link);
    }
  }

  test('if the calendar fails, the tiles and totals stay, and it can try again', async () => {
    answer({ calendarFails: true });
    await renderOnlyMonth();

    expect(
      (await screen.findAllByText('Couldn’t load the calendar.')).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText('Of 228 planned')).toBeOnTheScreen();
    expect(screen.getByText('Mon')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load the totals.')).toBeNull();

    answer();
    await tryAgain();

    expect(
      await screen.findByRole('button', { name: '2 November, Legs, missed' }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load the calendar.')).toBeNull();
  });

  test('if the totals fail, the calendar stays, the tiles show a dash, and it can try again', async () => {
    answer({ failing: 'month-summaries' });
    await renderOnlyMonth();

    expect(
      await screen.findByText('Couldn’t load the totals.'),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('–')).toHaveLength(3);
    expect(screen.getByText('Done')).toBeOnTheScreen();
    expect(screen.getByText('November totals')).toBeOnTheScreen();
    expect(
      await screen.findByRole('button', { name: '2 November, Legs, missed' }),
    ).toBeOnTheScreen();

    answer();
    await tryAgain();

    expect(await screen.findByText('Of 228 planned')).toBeOnTheScreen();
    expect(screen.queryByText('Couldn’t load the totals.')).toBeNull();
  });

  test('if both fail, each says so in its place', async () => {
    answer({ failing: 'month-summaries', calendarFails: true });
    await renderOnlyMonth();

    expect(
      await screen.findByText('Couldn’t load the totals.'),
    ).toBeOnTheScreen();
    expect(
      (await screen.findAllByText('Couldn’t load the calendar.')).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Done')).toBeOnTheScreen();
  });
});

describe('calendar', () => {
  test('a day that was done says so to screen readers', async () => {
    answer();
    await renderMonth();

    expect(
      await screen.findByRole('button', { name: '1 November, Legs, done' }),
    ).toBeOnTheScreen();
  });

  test.each([
    ['2026-11-02', darkColors.danger],
    ['2026-11-03', darkColors.onPrimary],
    ['2026-11-04', 'transparent'],
    ['2026-11-05', darkColors.skipped],
    ['2026-11-06', darkColors.muted],
  ])('the marker on %s', async (date, backgroundColor) => {
    answer();
    await renderMonth();

    await waitFor(() => {
      expect(screen.getByTestId(`marker-${date}`)).toHaveStyle({
        backgroundColor,
      });
    });
  });

  test('today starts selected, and is outlined once another day is', async () => {
    answer();
    await renderMonth();
    await waitFor(() => {
      expect(dayButton('3 November, Legs, today')).toHaveStyle({
        backgroundColor: darkColors.primary,
      });
    });

    await fireEvent.press(dayButton('2 November, Legs, missed'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(dayButton('2 November, Legs, missed')).toHaveStyle({
        backgroundColor: darkColors.primary,
      });
    });
    expect(dayButton('3 November, Legs, today')).toHaveStyle({
      backgroundColor: 'transparent',
      borderColor: darkColors.primary,
    });
  });

  test('leaves the days of other months empty', async () => {
    answer();
    await renderMonth();

    expect(screen.queryByRole('button', { name: /^31 October/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^1 December/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^30 November/ })).toBeTruthy();
  });
});

describe('changing month', () => {
  const calendar = () => screen.getByTestId('month-calendar');

  test('swiping changes the month, and shows it with its year', async () => {
    answer();
    await renderMonth();
    expect(screen.getByText('2026')).toBeOnTheScreen();

    await dragBy(calendar(), 200, 4, 'x');
    expect(await screen.findByText('October')).toBeOnTheScreen();
    expect(screen.getByText('October totals')).toBeOnTheScreen();
    expect(requested()).toContain('/api/v1/month-summaries/2026-10');

    await dragBy(calendar(), -200, 4, 'x');
    expect(await screen.findByText('November')).toBeOnTheScreen();
  });

  test('a short swipe stays', async () => {
    answer();
    await renderMonth();

    await dragBy(calendar(), 20, 4, 'x');

    expect(screen.getByText('November')).toBeOnTheScreen();
  });

  test('every month takes six weeks, so nothing moves below it', async () => {
    answer();
    await renderMonth();
    expect(screen.getAllByTestId('calendar-week').length % 6).toBe(0);
    const weeksNow = screen.getAllByTestId('calendar-week').length;

    await dragBy(calendar(), 200, 4, 'x');
    await screen.findByText('October');

    expect(screen.getAllByTestId('calendar-week')).toHaveLength(weeksNow);
  });

  test('screen readers can change the month from a day', async () => {
    answer();
    await renderMonth();
    const day = await screen.findByLabelText(/^10 November/);

    expect(day.props.accessibilityActions).toEqual([
      { name: 'previousMonth', label: 'Previous month' },
      { name: 'nextMonth', label: 'Next month' },
    ]);

    await fireEvent(day, 'accessibilityAction', {
      nativeEvent: { actionName: 'nextMonth' },
    });
    expect(await screen.findByText('December')).toBeOnTheScreen();

    await fireEvent(
      await screen.findByLabelText(/^1 December/),
      'accessibilityAction',
      { nativeEvent: { actionName: 'previousMonth' } },
    );
    expect(await screen.findByText('November')).toBeOnTheScreen();
  });

  test('chevrons show on the sides that have a month', async () => {
    answer();
    await renderMonth();

    expect(
      await screen.findByTestId('month-calendar-back-hint', {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId('month-calendar-forward-hint', {
        includeHiddenElements: true,
      }),
    ).toBeOnTheScreen();
  });

  test('the first month stops, and an earlier day says why', async () => {
    answer({ first: '2026-11-02' });
    await renderMonth();
    await waitFor(() => {
      expect(
        screen.queryByTestId('month-calendar-back-hint', {
          includeHiddenElements: true,
        }),
      ).toBeNull();
    });

    await dragBy(calendar(), 200, 4, 'x');
    expect(screen.getByText('November')).toBeOnTheScreen();

    await fireEvent.press(dayButton('1 November'));

    expect(
      await screen.findByText('Your history starts on Mon, 2nd Nov.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Open day' })).toBeNull();
  });

  test('the last month stops, and a later day says why', async () => {
    answer();
    await renderMonth();
    await dragBy(calendar(), -200, 4, 'x');
    await screen.findByText('December');

    // Today's week starts on 2 November, so days reach Sunday 6 December.
    expect(
      screen.queryByTestId('month-calendar-forward-hint', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
    await dragBy(calendar(), -200, 4, 'x');
    expect(screen.getByText('December')).toBeOnTheScreen();

    await fireEvent.press(dayButton('7 December'));

    expect(
      await screen.findByText('You can look 4 weeks ahead.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Open day' })).toBeNull();
  });
});

describe('Back to today', () => {
  const backToToday = () =>
    screen.queryByRole('button', { name: 'Back to today' });

  test('stays away on today', async () => {
    answer();
    await renderMonth();

    expect(backToToday()).toBeNull();
  });

  test('from another month, it returns to this month', async () => {
    answer();
    await renderMonth();
    await dragBy(screen.getByTestId('month-calendar'), 200, 4, 'x');
    await screen.findByText('October');

    await fireEvent.press(dayButton('Back to today'));

    expect(await screen.findByText('November')).toBeOnTheScreen();
    expect(backToToday()).toBeNull();
  });

  test('from another day, it selects today again', async () => {
    answer();
    await renderMonth();
    await fireEvent.press(
      await screen.findByRole('button', { name: '2 November, Legs, missed' }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Close' }));

    await fireEvent.press(dayButton('Back to today'));

    await waitFor(() => {
      expect(dayButton('3 November, Legs, today')).toHaveStyle({
        backgroundColor: darkColors.primary,
      });
    });
    expect(backToToday()).toBeNull();
  });
});

describe('day sheet', () => {
  test.each([
    ['2 November, Legs, missed', 'Missed · Mon, 2nd November'],
    ['5 November, Legs, skipped', 'Skipped · Thu, 5th November'],
    ['6 November, Legs, planned', 'Planned · Fri, 6th November'],
    ['3 November, Legs, today', 'Today · Tue, 3rd November'],
  ])('%s shows its status and targets', async (name, status) => {
    answer();
    await renderMonth();
    await screen.findByRole('button', { name });

    await fireEvent.press(dayButton(name));

    expect(await screen.findByText(status)).toBeOnTheScreen();
    expect(screen.getByText('Barbell squat')).toBeOnTheScreen();
    expect(screen.getByText('3 × 8–10')).toBeOnTheScreen();
  });

  test('a rest day says so', async () => {
    answer();
    await renderMonth();
    await screen.findByRole('button', { name: '4 November, rest day' });

    await fireEvent.press(dayButton('4 November, rest day'));

    expect(await screen.findByText('Rest day')).toBeOnTheScreen();
    expect(screen.getByText('Wed, 4th November')).toBeOnTheScreen();
    expect(
      screen.getByText('Nothing planned. Recovery is part of the program.'),
    ).toBeOnTheScreen();
  });

  test('if the day fails, it says so and can try again', async () => {
    answer({ failing: '/api/v1/days/2026-11-04' });
    await renderMonth();
    await screen.findByRole('button', { name: '4 November, rest day' });

    await fireEvent.press(dayButton('4 November, rest day'));
    expect(
      await screen.findByText('Couldn’t load this day.'),
    ).toBeOnTheScreen();

    answer();
    await fireEvent.press(screen.getByRole('link', { name: 'Try again' }));

    expect(
      await screen.findByText(
        'Nothing planned. Recovery is part of the program.',
      ),
    ).toBeOnTheScreen();
  });

  test('Open day goes back to the Workout tab, on that day', async () => {
    answer();
    await renderMonth();
    await screen.findByRole('button', { name: '2 November, Legs, missed' });

    await fireEvent.press(dayButton('2 November, Legs, missed'));
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Open day' }),
    );

    expect(await screen.findByText('Yesterday')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Back to today' }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('link', { name: 'Workout' })).toBeNull();
  });
});

test('the legend names In progress only while a workout runs', async () => {
  answer();
  await renderMonth();

  expect(
    (await screen.findAllByText('Planned', { includeHiddenElements: true }))
      .length,
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText('Rest', { includeHiddenElements: true }).length,
  ).toBeGreaterThan(0);
  expect(
    screen.queryByText('In progress', { includeHiddenElements: true }),
  ).toBeNull();
});

test('a workout in progress adds In progress to the legend', async () => {
  statuses['2026-11-06'] = { status: 'inProgress', routineName: 'Legs' };
  answer();

  try {
    await renderMonth();

    expect(
      await screen.findByText('In progress', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  } finally {
    statuses['2026-11-06'] = { status: 'planned', routineName: 'Legs' };
  }
});

test('the back link goes to the Workout tab', async () => {
  answer();
  await renderMonth();

  await fireEvent.press(screen.getByRole('link', { name: 'Workout' }));

  expect(await screen.findByRole('button', { name: 'Month' })).toBeTruthy();
});
