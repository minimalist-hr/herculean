import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Text, type RefreshControlProps } from 'react-native';

import UserRoute from '@/app/admin/users/[id]';
import { NotificationBar } from '@/components/notification-bar';
import { dismissNotification } from '@/components/notifications';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { setUsersFilter } from './users-filter';
import { lastActiveText } from './user-rows';
import { UsersScreen } from './users-screen';

const mockFetch = jest.fn<Promise<Response>, [Request]>();

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

const justNow = new Date().toISOString();

const ana = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  lastActiveAtUtc: justNow,
  deletionScheduledForUtc: null,
  closed: false,
  hasPhoto: true,
};

const ivo = {
  id: 'user-2',
  name: null,
  email: 'ivo@example.com',
  lastActiveAtUtc: null,
  deletionScheduledForUtc: '2026-11-25T12:00:00Z',
  closed: true,
  hasPhoto: false,
};

const anaAccount = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  createdAtUtc: '2026-10-16T09:00:00Z',
  lastActiveAtUtc: justNow,
  deletionScheduledForUtc: null,
  closed: false,
  hasPhoto: true,
};

const ticket = {
  id: 'ticket-1',
  type: 'bug',
  status: 'open',
  preview: 'The rest timer stops.',
  lastMessageAtUtc: '2026-11-10T09:05:00Z',
  waitingForReply: true,
  senderName: 'Ana',
  senderEmail: 'ana@example.com',
};

interface Answers {
  pages?: { users: object[]; nextCursor: string | null }[];
  listStatus?: number;
  nextPageStatus?: number;
  account?: object;
  accountStatus?: number;
  trainingStatus?: number;
  tickets?: object[];
  actionStatus?: number;
  blocked?: boolean;
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const url = new URL(request.url);
    const { pathname } = url;
    const json = (status: number | undefined, body: object) =>
      Promise.resolve(
        (status ?? 200) === 200
          ? Response.json(body)
          : new Response(null, { status }),
      );

    if (request.method !== 'GET') {
      return Promise.resolve(
        new Response(null, { status: answers.actionStatus ?? 204 }),
      );
    }
    if (pathname === '/api/v1/admin/users') {
      const pages = answers.pages ?? [{ users: [ana, ivo], nextCursor: null }];
      const cursor = url.searchParams.get('cursor');
      return cursor === null
        ? json(answers.listStatus, pages[0])
        : json(answers.nextPageStatus, pages[1]);
    }
    if (pathname === '/api/v1/admin/users/user-1/feedback-block') {
      return json(200, { blocked: answers.blocked ?? false });
    }
    if (pathname === '/api/v1/admin/users/user-1/photo') {
      return json(200, { image: '/9j/4A==' });
    }
    if (pathname === '/api/v1/admin/users/user-1/training') {
      return json(answers.trainingStatus, { workouts: 1204, routines: 3 });
    }
    if (pathname === '/api/v1/admin/users/user-1') {
      return json(answers.accountStatus, answers.account ?? anaAccount);
    }
    if (pathname === '/api/v1/admin/feedback') {
      return json(200, answers.tickets ?? [ticket]);
    }

    return json(404, {});
  });
}

function sent(method: string, path: string) {
  return mockFetch.mock.calls
    .map(([request]) => request)
    .filter(
      (request) =>
        request.method === method && new URL(request.url).pathname === path,
    );
}

function TicketStub() {
  const { id, back } = useLocalSearchParams<{ id: string; back: string }>();

  return <Text>{`Ticket ${id} from ${back}`}</Text>;
}

function Layout() {
  const [client] = useState(() => createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme="default">
        <Stack screenOptions={{ headerShown: false }} />
        <NotificationBar />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      'admin/users/index': UsersScreen,
      'admin/users/[id]': UserRoute,
      'admin/users/ticket/[id]': TicketStub,
    },
    { initialUrl },
  );
}

async function scrollToTheEnd() {
  await fireEvent.scroll(screen.getByTestId('users-scroll'), {
    nativeEvent: {
      contentOffset: { y: 1000 },
      contentSize: { height: 1200, width: 390 },
      layoutMeasurement: { height: 844, width: 390 },
    },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  setUsersFilter('all');
});

/** Clears a notification inside act, so it doesn't change the screen after the test. */
async function clearNotification() {
  await act(() => {
    dismissNotification();
  });
}

describe('Users', () => {
  test('lists users newest first, with their email and when they were last active or get deleted', async () => {
    answerWith();
    await renderAt('/admin/users');

    expect(await screen.findByText('Ana')).toBeOnTheScreen();
    expect(screen.getByText('ana@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Last active just now')).toBeOnTheScreen();
    expect(screen.getByText('ivo@example.com')).toBeOnTheScreen();
    expect(
      screen.getByText('Closed · deletes on Wed, 25th Nov'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'All', selected: true }),
    ).toBeOnTheScreen();
  });

  test('Deleting soon asks for those accounts', async () => {
    answerWith();
    await renderAt('/admin/users');
    await screen.findByText('Ana');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Deleting soon' }),
    );

    await waitFor(() => {
      expect(
        sent('GET', '/api/v1/admin/users').some(
          (request) =>
            new URL(request.url).searchParams.get('deletingSoon') === 'true',
        ),
      ).toBe(true);
    });
  });

  test('opens on Deleting soon when asked to', async () => {
    answerWith();
    setUsersFilter('deletingSoon');
    await renderAt('/admin/users');

    expect(
      await screen.findByRole('button', {
        name: 'Deleting soon',
        selected: true,
      }),
    ).toBeOnTheScreen();
  });

  test('after opening on Deleting soon, All can be picked again', async () => {
    answerWith();
    setUsersFilter('deletingSoon');
    await renderAt('/admin/users');
    await screen.findByRole('button', {
      name: 'Deleting soon',
      selected: true,
    });

    await fireEvent.press(screen.getByRole('button', { name: 'All' }));

    expect(
      await screen.findByRole('button', { name: 'All', selected: true }),
    ).toBeOnTheScreen();
  });

  test('searches as you type', async () => {
    answerWith();
    await renderAt('/admin/users');
    await screen.findByText('Ana');

    await fireEvent.changeText(screen.getByLabelText('Search users'), ' ana ');

    await waitFor(() => {
      expect(
        sent('GET', '/api/v1/admin/users').some(
          (request) =>
            new URL(request.url).searchParams.get('search') === 'ana',
        ),
      ).toBe(true);
    });
  });

  test('a search with nothing says so', async () => {
    answerWith({ pages: [{ users: [ana], nextCursor: null }] });
    await renderAt('/admin/users');
    await screen.findByText('Ana');
    answerWith({ pages: [{ users: [], nextCursor: null }] });

    await fireEvent.changeText(screen.getByLabelText('Search users'), 'zz');

    expect(await screen.findByText('No users match')).toBeOnTheScreen();
    expect(screen.getByText('Try another name or email.')).toBeOnTheScreen();
  });

  test('Deleting soon with nothing says so', async () => {
    answerWith({ pages: [{ users: [], nextCursor: null }] });
    setUsersFilter('deletingSoon');
    await renderAt('/admin/users');

    expect(
      await screen.findByText('No accounts deleting soon'),
    ).toBeOnTheScreen();
  });

  test('with no users, search and chips look muted and say why', async () => {
    answerWith({ pages: [{ users: [], nextCursor: null }] });
    await renderAt('/admin/users');

    expect(await screen.findByText('No users yet')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Deleting soon' }),
    );

    expect(await screen.findByText('No users yet.')).toBeOnTheScreen();
    await clearNotification();
  });

  test('more users load at the end of the list, and a failed page can be tried again', async () => {
    answerWith({
      pages: [
        { users: [ana], nextCursor: 'cursor-1' },
        { users: [ivo], nextCursor: null },
      ],
      nextPageStatus: 500,
    });
    await renderAt('/admin/users');
    await screen.findByText('Ana');

    await scrollToTheEnd();
    await screen.findByText('Couldn’t load more users.');
    const retry = screen.getByRole('link', { name: 'Try again' });
    answerWith({
      pages: [
        { users: [ana], nextCursor: 'cursor-1' },
        { users: [ivo], nextCursor: null },
      ],
    });
    await fireEvent.press(retry);

    expect(await screen.findByText('ivo@example.com')).toBeOnTheScreen();
  });

  test('a failed list says so, and Try again reads it', async () => {
    answerWith({ listStatus: 500 });
    await renderAt('/admin/users');

    await screen.findByText('Couldn’t load users.');
    const retry = screen.getByRole('link', { name: 'Try again' });
    answerWith();
    await fireEvent.press(retry);

    expect(await screen.findByText('Ana')).toBeOnTheScreen();
  });

  test('pulling down reads the list again', async () => {
    answerWith();
    await renderAt('/admin/users');
    await screen.findByText('Ana');
    mockFetch.mockClear();

    const { refreshControl } = screen.getByTestId('users-scroll').props as {
      refreshControl: { props: RefreshControlProps };
    };
    await act(() => {
      void refreshControl.props.onRefresh?.();
    });

    await waitFor(() => {
      expect(sent('GET', '/api/v1/admin/users')).toHaveLength(1);
    });
  });

  test('a user opens their page with Users as its back link', async () => {
    answerWith();
    await renderAt('/admin/users');

    await fireEvent.press(await screen.findByRole('button', { name: /^Ana/ }));

    expect(await screen.findByText('Joined')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Users' })).toBeOnTheScreen();
  });
});

describe('A user', () => {
  test('shows when they joined and were last active, their counts and their feedback', async () => {
    answerWith();
    await renderAt('/admin/users/user-1');

    expect(await screen.findByText('Fri, 16th Oct')).toBeOnTheScreen();
    expect(screen.getByText('Just now')).toBeOnTheScreen();
    expect(await screen.findByText('1,204')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(await screen.findByText('Feedback · 1')).toBeOnTheScreen();
    expect(screen.getByText('The rest timer stops.')).toBeOnTheScreen();
    expect(sent('GET', '/api/v1/admin/feedback')[0].url).toContain(
      'userId=user-1',
    );
  });

  test('a ticket opens with their name as its back link', async () => {
    answerWith();
    await renderAt('/admin/users/user-1');
    await screen.findByText('Ana');

    await fireEvent.press(await screen.findByRole('button', { name: /^Bug/ }));

    expect(
      await screen.findByText('Ticket ticket-1 from Ana'),
    ).toBeOnTheScreen();
  });

  test('without feedback, a dashed box says so', async () => {
    answerWith({ tickets: [] });
    await renderAt('/admin/users/user-1');

    expect(
      await screen.findByText('No feedback from this user'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Feedback · 0')).toBeOnTheScreen();
  });

  test.each([
    [
      'Sign out all devices',
      'Sign out all devices?',
      'POST',
      '/api/v1/admin/users/user-1/sessions/revoke',
      'Signed out of every device.',
    ],
    [
      'Send reset link',
      'Send a reset link?',
      'POST',
      '/api/v1/admin/users/user-1/password-reset',
      'Reset link sent.',
    ],
    [
      'Close account',
      'Close this account?',
      'POST',
      '/api/v1/admin/users/user-1/deletion',
      'Account closed.',
    ],
    [
      'Remove photo',
      'Remove their photo?',
      'DELETE',
      '/api/v1/admin/users/user-1/photo',
      'Photo removed.',
    ],
  ])(
    '%s asks first, then does it',
    async (label, question, method, path, done) => {
      answerWith();
      await renderAt('/admin/users/user-1');
      await screen.findByText('Joined');
      await screen.findByText('Ana');

      await fireEvent.press(screen.getByRole('button', { name: label }));
      expect(await screen.findByText(question)).toBeOnTheScreen();
      expect(sent(method, path)).toHaveLength(0);
      const buttons = screen.getAllByRole('button', { name: label });
      await fireEvent.press(buttons[buttons.length - 1]);

      expect(await screen.findByText(done)).toBeOnTheScreen();
      expect(sent(method, path)).toHaveLength(1);
      await clearNotification();
    },
  );

  test('an account waiting for deletion says when, and Cancel deletion keeps it', async () => {
    answerWith({
      account: {
        ...anaAccount,
        deletionScheduledForUtc: '2026-11-25T12:00:00Z',
      },
    });
    await renderAt('/admin/users/user-1');

    expect(
      await screen.findByText('Deletes on Wed, 25th Nov'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Close account' }),
    ).not.toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cancel deletion' }),
    );
    expect(await screen.findByText('Cancel the deletion?')).toBeOnTheScreen();
    const buttons = screen.getAllByRole('button', { name: 'Cancel deletion' });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(await screen.findByText('Deletion cancelled.')).toBeOnTheScreen();
    expect(sent('DELETE', '/api/v1/admin/users/user-1/deletion')).toHaveLength(
      1,
    );
    await clearNotification();
  });

  test('a failed action says so', async () => {
    answerWith({ actionStatus: 500 });
    await renderAt('/admin/users/user-1');
    await screen.findByText('Ana');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Send reset link' }),
    );
    const buttons = await screen.findAllByRole('button', {
      name: 'Send reset link',
    });
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(
      await screen.findByText('Couldn’t do that. Try again.'),
    ).toBeOnTheScreen();
  });

  test('while the page fails, its actions look muted and say why', async () => {
    answerWith({ accountStatus: 500 });
    await renderAt('/admin/users/user-1');

    expect(
      await screen.findByText('Couldn’t load this user.'),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Sign out all devices' }),
    );

    expect(
      await screen.findByText('This page hasn’t loaded yet.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Sign out all devices?')).not.toBeOnTheScreen();
    await clearNotification();
  });

  test('failed counts show a dash and Try again, while the rest stays', async () => {
    answerWith({ trainingStatus: 500 });
    await renderAt('/admin/users/user-1');

    await screen.findByText('Couldn’t load their counts.');
    const retry = screen.getByRole('link', { name: 'Try again' });
    expect(screen.getByText('Fri, 16th Oct')).toBeOnTheScreen();
    expect(screen.getAllByText('–')).toHaveLength(2);
    answerWith();
    await fireEvent.press(retry);

    expect(await screen.findByText('1,204')).toBeOnTheScreen();
  });
});

describe('Closed and photos', () => {
  test('a closed account says so on its page', async () => {
    answerWith({
      account: {
        ...anaAccount,
        deletionScheduledForUtc: '2026-11-25T12:00:00Z',
        closed: true,
      },
    });
    await renderAt('/admin/users/user-1');

    expect(
      await screen.findByText('Closed · deletes on Wed, 25th Nov'),
    ).toBeOnTheScreen();
  });

  test('without a photo, Remove photo isn’t there', async () => {
    answerWith({ account: { ...anaAccount, hasPhoto: false } });
    await renderAt('/admin/users/user-1');
    // The labels show at once; the name shows once the user has loaded.
    await screen.findByText('Ana');

    expect(
      screen.queryByRole('button', { name: 'Remove photo' }),
    ).not.toBeOnTheScreen();
    expect(
      screen.getByText('A', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(sent('GET', '/api/v1/admin/users/user-1/photo')).toHaveLength(0);
  });

  test('with a photo, it is read for the avatar', async () => {
    answerWith();
    await renderAt('/admin/users/user-1');

    await waitFor(() => {
      expect(sent('GET', '/api/v1/admin/users/user-1/photo')).toHaveLength(1);
    });
  });

  test.each([
    [0, 'Last active just now'],
    [60 * 26, 'Last active yesterday,'],
  ])('%d minutes ago reads %s', (minutes, start) => {
    const now = new Date(2026, 10, 12, 12, 0);
    const then = new Date(now.getTime() - minutes * 60_000).toISOString();

    expect(lastActiveText(then, now)).toMatch(new RegExp(`^${start}`));
  });

  test('a day keeps its capital', () => {
    const now = new Date(2026, 10, 12, 12, 0);

    expect(
      lastActiveText(new Date(2026, 10, 9, 14, 5).toISOString(), now),
    ).toBe('Last active Mon, 9th Nov, 14:05');
  });
});

describe('Blocking feedback', () => {
  test('the details say whether they can send feedback', async () => {
    answerWith({ blocked: true });
    await renderAt('/admin/users/user-1');

    expect(await screen.findByText('Blocked')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Unblock feedback' }),
    ).toBeOnTheScreen();
  });

  test.each([
    [
      false,
      'Block feedback',
      'Block their feedback?',
      'PUT',
      'Feedback blocked.',
    ],
    [
      true,
      'Unblock feedback',
      'Unblock their feedback?',
      'DELETE',
      'Feedback unblocked.',
    ],
  ])(
    'blocked %s: %s asks first, then does it',
    async (blocked, label, question, method, done) => {
      answerWith({ blocked });
      await renderAt('/admin/users/user-1');
      await screen.findByText(blocked ? 'Blocked' : 'Allowed');
      await screen.findByText('Ana');

      await fireEvent.press(screen.getByRole('button', { name: label }));
      expect(await screen.findByText(question)).toBeOnTheScreen();
      const buttons = screen.getAllByRole('button', { name: label });
      await fireEvent.press(buttons[buttons.length - 1]);

      expect(await screen.findByText(done)).toBeOnTheScreen();
      expect(
        sent(method, '/api/v1/admin/users/user-1/feedback-block'),
      ).toHaveLength(1);
      await clearNotification();
    },
  );
});
