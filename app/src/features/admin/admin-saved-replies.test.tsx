import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';

import { NotificationBar } from '@/components/notification-bar';
import { dismissNotification } from '@/components/notifications';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';

import AdminThemeRoute from '@/app/admin/settings/theme';

import { AdminSettingsScreen } from './admin-settings-screen';
import {
  EditSavedReplyScreen,
  NewSavedReplyScreen,
  SavedRepliesScreen,
} from './saved-replies-screen';
import { fillName } from './use-saved-replies';

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

const fixed = {
  id: 'reply-1',
  title: 'Fixed',
  text: 'Fixed in 1.0.1, {name}.',
};

interface Answers {
  replies?: object[];
  listStatus?: number;
  saveStatus?: number;
  saveBody?: object;
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/v1/users/me') {
      return Promise.resolve(
        Response.json({
          email: 'admin@minimalist.hr',
          name: null,
          units: 'metric',
          theme: 'smoke',
          timeZone: 'Etc/UTC',
          role: 'admin',
        }),
      );
    }
    if (pathname === '/api/v1/admin/health') {
      return Promise.resolve(
        Response.json({ checkedAtUtc: new Date().toISOString(), services: [] }),
      );
    }
    if (request.method === 'GET') {
      return Promise.resolve(
        (answers.listStatus ?? 200) === 200
          ? Response.json(answers.replies ?? [fixed])
          : new Response(null, { status: answers.listStatus }),
      );
    }

    const status =
      answers.saveStatus ?? (request.method === 'POST' ? 200 : 204);
    return Promise.resolve(
      status === 204
        ? new Response(null, { status })
        : Response.json(answers.saveBody ?? { id: 'reply-2' }, { status }),
    );
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
      'admin/settings/index': AdminSettingsScreen,
      'admin/settings/theme': AdminThemeRoute,
      'admin/settings/saved-replies/index': SavedRepliesScreen,
      'admin/settings/saved-replies/new': NewSavedReplyScreen,
      'admin/settings/saved-replies/[id]': EditSavedReplyScreen,
    },
    { initialUrl },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

/** Clears a notification inside act, so it doesn't change the screen after the test. */
async function clearNotification() {
  await act(() => {
    dismissNotification();
  });
}

describe('Saved replies', () => {
  test('Settings shows how many there are and opens them', async () => {
    answerWith();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Saved replies, 1' }),
    );

    expect(
      await screen.findByText('Answers you send often.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Fixed in 1.0.1, {name}.')).toBeOnTheScreen();
  });

  test('Settings has Appearance, and Themes opens with Settings as its back link', async () => {
    answerWith();
    await renderAt('/admin/settings');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Themes, Smoke' }),
    );

    expect(
      await screen.findByRole('link', { name: 'Settings' }),
    ).toBeOnTheScreen();
  });

  test('with none, a dashed box says so', async () => {
    answerWith({ replies: [] });
    await renderAt('/admin/settings/saved-replies');

    expect(
      await screen.findByText('Add one to answer faster.'),
    ).toBeOnTheScreen();
  });

  test('a failed list says so', async () => {
    answerWith({ listStatus: 500 });
    await renderAt('/admin/settings/saved-replies');

    expect(
      await screen.findByText('Couldn’t load saved replies.'),
    ).toBeOnTheScreen();
  });

  test('at 50, New looks muted and says why', async () => {
    answerWith({
      replies: Array.from({ length: 50 }, (_, index) => ({
        ...fixed,
        id: `reply-${String(index)}`,
        title: `Reply ${String(index)}`,
      })),
    });
    await renderAt('/admin/settings/saved-replies');
    await screen.findByText('Reply 0');

    await fireEvent.press(
      screen.getByRole('button', { name: 'New saved reply' }),
    );

    expect(
      await screen.findByText('At most 50 saved replies.'),
    ).toBeOnTheScreen();
    await clearNotification();
  });

  test('a new reply is saved', async () => {
    answerWith();
    await renderAt('/admin/settings/saved-replies');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'New saved reply' }),
    );
    expect(
      await screen.findByText('Write {name} for the user’s name.'),
    ).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Thanks');
    await fireEvent.changeText(
      screen.getByLabelText('Text'),
      'Thanks, {name}!',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Save reply' }));

    expect(await screen.findByText('Saved reply added.')).toBeOnTheScreen();
    await expect(
      sent('POST', '/api/v1/admin/feedback/saved-replies')[0].clone().json(),
    ).resolves.toEqual({ title: 'Thanks', text: 'Thanks, {name}!' });
    await clearNotification();
  });

  test('a taken title shows under Title', async () => {
    answerWith({
      saveStatus: 400,
      saveBody: {
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        code: 'validation',
        errors: { title: ['A saved reply already has this title.'] },
        traceId: '1',
      },
    });
    await renderAt('/admin/settings/saved-replies/new');

    await fireEvent.changeText(await screen.findByLabelText('Title'), 'Fixed');
    await fireEvent.changeText(screen.getByLabelText('Text'), 'Text');
    await fireEvent.press(screen.getByRole('button', { name: 'Save reply' }));

    expect(
      await screen.findByText('A saved reply already has this title.'),
    ).toBeOnTheScreen();
  });

  test('empty fields say so', async () => {
    answerWith();
    await renderAt('/admin/settings/saved-replies/new');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Save reply' }),
    );

    expect(await screen.findByText('Enter a title.')).toBeOnTheScreen();
    expect(screen.getByText('Write the reply.')).toBeOnTheScreen();
  });

  test('a reply opens to edit, and saves', async () => {
    answerWith();
    await renderAt('/admin/settings/saved-replies');

    await fireEvent.press(await screen.findByRole('button', { name: 'Fixed' }));
    await fireEvent.changeText(
      await screen.findByLabelText('Title'),
      'Fixed now',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Save reply' }));

    expect(await screen.findByText('Saved reply changed.')).toBeOnTheScreen();
    await expect(
      sent('PUT', '/api/v1/admin/feedback/saved-replies/reply-1')[0]
        .clone()
        .json(),
    ).resolves.toEqual({ title: 'Fixed now', text: 'Fixed in 1.0.1, {name}.' });
    await clearNotification();
  });

  test('Delete asks first, then deletes', async () => {
    answerWith();
    await renderAt('/admin/settings/saved-replies');
    await fireEvent.press(await screen.findByRole('button', { name: 'Fixed' }));

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Delete saved reply' }),
    );
    expect(
      await screen.findByText('Delete this saved reply?'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(
        sent('DELETE', '/api/v1/admin/feedback/saved-replies/reply-1'),
      ).toHaveLength(1);
    });
    await clearNotification();
  });

  test.each([
    ['Hi {name},', 'Ana', 'Hi Ana,'],
    ['Hi {name},', null, 'Hi there,'],
    ['{name}, {name}', 'Ivo', 'Ivo, Ivo'],
  ])('%s with %s reads %s', (text, name, filled) => {
    expect(fillName(text, name)).toBe(filled);
  });
});
