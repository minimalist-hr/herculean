import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState, type ReactElement } from 'react';
import { Text, type RefreshControlProps } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import AdminTabsLayout from '@/app/admin/_layout';

import { AdminSettingsScreen } from './admin-settings-screen';
import { setUsersFilter, useUsersFilter } from './users-filter';
import { changeOnLastWeek, OverviewScreen } from './overview-screen';
import { SystemHealthScreen } from './system-health-screen';
import { summaryOf, type ServiceHealth } from './use-system-health';

const mockFetch = jest.fn<Promise<Response>, [Request]>();
const mockSignOut = jest.fn<Promise<void>, []>();

jest.mock('@/api/client', () => {
  const createClient =
    jest.requireActual<typeof import('openapi-fetch')>('openapi-fetch').default;
  return {
    api: createClient({
      baseUrl: 'http://api.test',
      fetch: (request: Request) => mockFetch(request),
    }),
    refreshTokens: () => Promise.resolve(true),
  };
});

jest.mock('@/features/account/session-flows', () => ({
  signOut: () => mockSignOut(),
}));

const userStats = {
  total: 50,
  newThisWeek: 4,
  deletingSoon: 2,
  newPerWeek: [3, 5, 2, 4],
};

const trainingStats = {
  activeThisWeek: 19,
  workoutsThisWeek: 52,
  workoutsLastWeek: 40,
  activePerWeek: [15, 17, 18, 19],
  workoutsPerWeek: [38, 44, 40, 52],
};

function service(
  name: string,
  status: ServiceHealth['status'] = 'working',
  detail = 'Fine.',
): ServiceHealth {
  return { name, status, durationMs: 12, detail };
}

const working = [
  service('API', 'working', 'Answering requests.'),
  service('Database', 'working', 'PostgreSQL 18.3'),
  service('Email', 'working', 'Reached smtp.resend.com.'),
  service('Outbox', 'working', 'Nothing waiting.'),
  service('Deletion job', 'working', 'Ran 2 hours ago.'),
];

interface Answers {
  users?: number;
  training?: number;
  services?: ServiceHealth[];
  healthStatus?: number;
  announcement?: object;
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    const answer = (status: number | undefined, body: object) =>
      Promise.resolve(
        (status ?? 200) === 200
          ? Response.json(body)
          : new Response(null, { status }),
      );

    switch (pathname) {
      case '/api/v1/admin/users/stats':
        return answer(answers.users, userStats);
      case '/api/v1/admin/training/stats':
        return answer(answers.training, trainingStats);
      case '/api/v1/admin/feedback/stats':
        return answer(200, { waitingForReply: 3, highWaitingForReply: 2 });
      case '/api/v1/admin/announcement':
        return answer(200, { announcement: answers.announcement ?? null });
      case '/api/v1/admin/health':
        return answer(answers.healthStatus, {
          checkedAtUtc: new Date().toISOString(),
          services: answers.services ?? working,
        });
      default:
        return answer(200, []);
    }
  });
}

function paths() {
  return mockFetch.mock.calls.map(([request]) => new URL(request.url).pathname);
}

function Layout() {
  const [client] = useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="dark">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function UsersStub() {
  return <Text>{`Users page ${useUsersFilter()}`}</Text>;
}

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      'admin/_layout': AdminTabsLayout,
      'admin/index': OverviewScreen,
      'admin/feedback/index': () => <Text>Feedback page</Text>,
      'admin/users/index': UsersStub,
      'admin/settings/_layout': () => (
        <Stack screenOptions={{ headerShown: false }} />
      ),
      'admin/settings/index': AdminSettingsScreen,
      'admin/settings/health': SystemHealthScreen,
    },
    { initialUrl },
  );
}

async function pullDown(testID: string) {
  const { refreshControl } = screen.getByTestId(testID).props as {
    refreshControl: ReactElement<RefreshControlProps>;
  };
  await act(() => {
    void refreshControl.props.onRefresh?.();
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  setUsersFilter('all');
  mockSignOut.mockReset();
});

describe('Overview', () => {
  test('shows each tile with its detail and trend', async () => {
    answerWith();
    await renderAt('/admin');

    expect(await screen.findByText('+14')).toBeOnTheScreen();
    expect(screen.getByText('in 4 weeks')).toBeOnTheScreen();
    expect(screen.getByText('+4')).toBeOnTheScreen();
    expect(screen.getByText('50')).toBeOnTheScreen();
    expect(await screen.findByText('38% of users')).toBeOnTheScreen();
    expect(screen.getByText('+12 on last week')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
    expect(screen.getAllByTestId('trend-line')).toHaveLength(3);
  });

  test('Waiting for a reply opens Feedback', async () => {
    answerWith();
    await renderAt('/admin');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'To answer, 3' }),
    );

    expect(await screen.findByText('Feedback page')).toBeOnTheScreen();
  });

  test('an announcement on Home shows as a reminder under the heading', async () => {
    answerWith({
      announcement: {
        id: 'a1',
        title: 'New in 1.1',
        text: 'Supersets.',
        publishedAtUtc: '2026-11-12T09:00:00Z',
      },
    });
    await renderAt('/admin');

    expect(
      await screen.findByRole('button', {
        name: 'Announcement on Home since Thu, 12th Nov',
      }),
    ).toBeOnTheScreen();
  });

  test('without an announcement, there is no reminder', async () => {
    answerWith();
    await renderAt('/admin');
    await screen.findByText('+14');

    expect(screen.queryByText(/^Announcement on Home/)).not.toBeOnTheScreen();
  });

  test('To answer says how many are high', async () => {
    answerWith();
    await renderAt('/admin');

    expect(await screen.findByText('2 high')).toBeOnTheScreen();
  });

  test('Deleting soon opens Users on Deleting soon', async () => {
    answerWith();
    await renderAt('/admin');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Deleting soon, 2' }),
    );

    expect(
      await screen.findByText('Users page deletingSoon'),
    ).toBeOnTheScreen();
  });

  test('a tile that fails shows a dash and Try again, while the others stay', async () => {
    answerWith({ training: 500 });
    await renderAt('/admin');

    expect(await screen.findByText('+14')).toBeOnTheScreen();
    const retry = await screen.findByRole('link', {
      name: 'Couldn’t load active users. Try again',
    });
    expect(screen.getAllByText('–')).toHaveLength(2);
    answerWith();
    await fireEvent.press(retry);

    expect(await screen.findByText('+12 on last week')).toBeOnTheScreen();
  });

  test('pulling down reads every tile again', async () => {
    answerWith();
    await renderAt('/admin');
    await screen.findByText('+14');
    mockFetch.mockClear();

    await pullDown('overview-scroll');

    await waitFor(() => {
      expect(paths()).toEqual(
        expect.arrayContaining([
          '/api/v1/admin/users/stats',
          '/api/v1/admin/training/stats',
          '/api/v1/admin/feedback/stats',
        ]),
      );
    });
  });

  test.each([
    [12, '+12 on last week'],
    [-3, '–3 on last week'],
    [0, 'Same as last week'],
  ])('a change of %d reads %s', (change, text) => {
    expect(changeOnLastWeek(change)).toBe(text);
  });
});

describe('Admin tabs', () => {
  test('Users opens its page', async () => {
    answerWith();
    await renderAt('/admin');

    await fireEvent.press(await screen.findByRole('tab', { name: 'Users' }));

    expect(await screen.findByText('Users page all')).toBeOnTheScreen();
  });

  test('a service down puts a dot on Settings', async () => {
    answerWith({
      services: [
        ...working.slice(0, 4),
        service('Deletion job', 'down', 'Ran 2 hours ago, and failed.'),
      ],
    });
    await renderAt('/admin');

    expect(
      await screen.findByRole('tab', { name: 'Settings, system down' }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('tab-badge')).toBeOnTheScreen();
  });

  test('without a service down, Settings has no dot', async () => {
    answerWith();
    await renderAt('/admin');
    await screen.findByText('+14');

    await waitFor(() => {
      expect(paths()).toContain('/api/v1/admin/health');
    });
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeOnTheScreen();
    expect(screen.queryByTestId('tab-badge')).not.toBeOnTheScreen();
  });
});

describe('Settings', () => {
  test('pulling down reads the summary again', async () => {
    answerWith();
    await renderAt('/admin/settings');
    await screen.findByText('All working');
    mockFetch.mockClear();

    await pullDown('admin-settings-scroll');

    await waitFor(() => {
      expect(paths()).toContain('/api/v1/admin/health');
    });
  });

  test('System health shows the summary and opens the page', async () => {
    answerWith();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'System health, All working' }),
    );

    expect(await screen.findByText('All systems working')).toBeOnTheScreen();
    expect(screen.getByText('PostgreSQL 18.3')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Outbox, Working, 12 ms, Nothing waiting.'),
    ).toBeOnTheScreen();
  });

  test('a service that needs attention shows on the row', async () => {
    answerWith({
      services: [
        ...working.slice(0, 3),
        service('Outbox', 'behind', '1 event failed.'),
        working[4],
      ],
    });
    await renderAt('/admin/settings');

    expect(
      await screen.findByRole('button', {
        name: 'System health, 1 needs attention, open it to see why',
      }),
    ).toBeOnTheScreen();
  });

  test('Sign out asks first, then signs out', async () => {
    answerWith();
    mockSignOut.mockResolvedValue();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Sign out' }),
    );
    expect(await screen.findByText('Sign out?')).toBeOnTheScreen();
    const buttons = screen.getAllByRole('button', { name: 'Sign out' });
    await fireEvent.press(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});

describe('System health', () => {
  test('a service down shows in the summary and its row', async () => {
    answerWith({
      services: [
        working[0],
        service('Database', 'down', 'Couldn’t reach the database.'),
        ...working.slice(2),
      ],
    });
    await renderAt('/admin/settings/health');

    expect(await screen.findByText('1 down')).toBeOnTheScreen();
    expect(screen.getByText('Couldn’t reach the database.')).toBeOnTheScreen();
    expect(screen.getByText('Down')).toBeOnTheScreen();
  });

  test('a check that fails says so', async () => {
    answerWith({ healthStatus: 500 });
    await renderAt('/admin/settings/health');

    expect(
      await screen.findByText('Couldn’t check the system.'),
    ).toBeOnTheScreen();
  });

  test('pulling down checks again', async () => {
    answerWith();
    await renderAt('/admin/settings/health');
    await screen.findByText('All systems working');
    mockFetch.mockClear();

    await pullDown('health-scroll');

    await waitFor(() => {
      expect(paths()).toContain('/api/v1/admin/health');
    });
  });

  test.each([
    [working, 'All working', 'All systems working'],
    [[service('Email', 'slow')], '1 needs attention', '1 needs attention'],
    [
      [service('Email', 'slow'), service('Outbox', 'behind')],
      '2 need attention',
      '2 need attention',
    ],
    [
      [service('Email', 'down'), service('Outbox', 'behind')],
      '1 down',
      '1 down',
    ],
  ])('services add up to a summary', (services, short, long) => {
    expect(summaryOf(services)).toMatchObject({ short, long });
  });
});
