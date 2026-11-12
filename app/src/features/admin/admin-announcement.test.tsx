import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';

import AnnouncementRoute from '@/app/admin/settings/announcement';
import { NotificationBar } from '@/components/notification-bar';
import { dismissNotification } from '@/components/notifications';
import { announcementStatus } from '@/features/announcement/use-announcement';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import { AdminSettingsScreen } from './admin-settings-screen';

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

const live = {
  id: 'a1',
  title: 'New in 1.1',
  text: 'Supersets are here.',
  publishedAtUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
};

interface Answers {
  announcement?: object | null;
  status?: number;
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/admin/announcement') {
      if (request.method !== 'GET') {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        (answers.status ?? 200) === 200
          ? Response.json({ announcement: answers.announcement ?? null })
          : new Response(null, { status: answers.status }),
      );
    }
    if (pathname === '/api/v1/admin/health') {
      return Promise.resolve(
        Response.json({ checkedAtUtc: new Date().toISOString(), services: [] }),
      );
    }

    return Promise.resolve(Response.json([]));
  });
}

function sent(method: string) {
  return mockFetch.mock.calls
    .map(([request]) => request)
    .filter(
      (request) =>
        request.method === method &&
        new URL(request.url).pathname === '/api/v1/admin/announcement',
    );
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

async function renderAt(initialUrl: string) {
  await renderRouter(
    {
      _layout: Layout,
      'admin/settings/index': AdminSettingsScreen,
      'admin/settings/announcement': AnnouncementRoute,
    },
    { initialUrl },
  );
}

/** Clears a notification inside act, so it doesn't change the screen after the test. */
async function clearNotification() {
  await act(() => {
    dismissNotification();
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Announcement', () => {
  test('Settings says it is off and opens the page', async () => {
    answerWith();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Announcement, Off' }),
    );

    expect(
      await screen.findByText('Shown on everyone’s Home until you remove it.'),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Remove the announcement' }),
    ).not.toBeOnTheScreen();
  });

  test('Settings says how long one has been on', async () => {
    answerWith({ announcement: live });
    await renderAt('/admin/settings');

    expect(
      await screen.findByRole('button', { name: 'Announcement, On · 3 days' }),
    ).toBeOnTheScreen();
  });

  test('the preview follows what is typed, and Save puts it on Home', async () => {
    answerWith();
    await renderAt('/admin/settings/announcement');

    expect(await screen.findByText('Your announcement.')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Title'), 'New in 1.1');
    await fireEvent.changeText(screen.getByLabelText('Text'), 'Supersets.');
    expect(screen.getAllByText('New in 1.1').length).toBeGreaterThan(0);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Save announcement' }),
    );

    expect(await screen.findByText('Announcement on Home.')).toBeOnTheScreen();
    await expect(sent('PUT')[0].clone().json()).resolves.toEqual({
      title: 'New in 1.1',
      text: 'Supersets.',
    });
    await clearNotification();
  });

  test('empty fields say so', async () => {
    answerWith();
    await renderAt('/admin/settings/announcement');

    // The button shows before the form has loaded.
    await screen.findByLabelText('Title');
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Save announcement' }),
    );

    expect(await screen.findByText('Enter a title.')).toBeOnTheScreen();
    expect(screen.getByText('Write the announcement.')).toBeOnTheScreen();
  });

  test('a live one opens filled in, and the trash removes it after asking', async () => {
    answerWith({ announcement: live });
    await renderAt('/admin/settings/announcement');

    expect(await screen.findByLabelText('Title')).toHaveDisplayValue(
      'New in 1.1',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Remove the announcement' }),
    );
    expect(
      await screen.findByText('Remove the announcement?'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(sent('DELETE')).toHaveLength(1);
    });
    await clearNotification();
  });

  test('a failed load says so', async () => {
    answerWith({ status: 500 });
    await renderAt('/admin/settings/announcement');

    expect(
      await screen.findByText('Couldn’t load the announcement.'),
    ).toBeOnTheScreen();
  });

  test.each([
    [null, 'Off'],
    [0, 'On · today'],
    [1, 'On · 1 day'],
    [5, 'On · 5 days'],
  ])('%s days on reads %s', (days, status) => {
    const now = new Date(2026, 10, 20, 12, 0);
    const announcement =
      days === null
        ? null
        : {
            ...live,
            publishedAtUtc: new Date(
              now.getTime() - days * 24 * 60 * 60 * 1000,
            ).toISOString(),
          };

    expect(announcementStatus(announcement, now)).toBe(status);
  });
});
