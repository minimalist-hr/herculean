import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState, type ReactElement } from 'react';
import { Text, type RefreshControlProps } from 'react-native';

import { NotificationBar } from '@/components/notification-bar';
import { createTestQueryClient } from '@/test-utils/query-client';
import { ThemeProvider } from '@/theme/theme-provider';
import { tokens } from '@/theme/tokens';

import { InboxScreen } from './inbox-screen';
import InboxTicketRoute from '@/app/admin/feedback/[id]';

import { AddNoteScreen } from './add-note-screen';

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

const waiting = {
  id: 'ticket-1',
  type: 'bug',
  status: 'open',
  preview: 'The rest timer stops.',
  lastMessageAtUtc: '2026-11-10T09:05:00Z',
  waitingForReply: true,
  senderName: 'Ana',
  senderEmail: 'ana@example.com',
};

const gone = {
  ...waiting,
  id: 'ticket-2',
  type: 'suggestion',
  preview: 'A dark timer.',
  waitingForReply: false,
  senderName: null,
  senderEmail: null,
};

function ticketOf(status: string) {
  return {
    id: 'ticket-1',
    type: 'bug',
    status,
    senderId: 'user-1',
    senderName: 'Ana',
    senderEmail: 'ana@example.com',
    appVersion: '1.0.0',
    phone: 'Google Pixel 8',
    os: 'Android 15',
    priority: 'normal',
    notes: [],
    messages: [
      {
        id: 'message-1',
        author: 'user',
        text: 'The rest timer stops.',
        sentAtUtc: '2026-11-10T09:05:00Z',
        screenshotIds: ['screenshot-1'],
      },
      {
        id: 'message-2',
        author: 'admin',
        text: 'Which phone is it on?',
        sentAtUtc: '2026-11-10T10:05:00Z',
        screenshotIds: [],
      },
    ],
  };
}

interface Answers {
  list?: object[];
  listStatus?: number;
  status?: string;
  statusChange?: number;
  notes?: object[];
  priority?: string;
  savedReplies?: object[];
}

function answerWith(answers: Answers = {}) {
  mockFetch.mockImplementation((request) => {
    const url = new URL(request.url);
    const parts = url.pathname.split('/') as (string | undefined)[];
    const id = parts[5];
    const part = parts[6];

    if (id === 'saved-replies') {
      return Promise.resolve(Response.json(answers.savedReplies ?? []));
    }
    if (request.method === 'PUT' || request.method === 'DELETE') {
      return Promise.resolve(
        new Response(null, { status: answers.statusChange ?? 204 }),
      );
    }
    if (request.method === 'POST') {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (id === undefined) {
      return Promise.resolve(
        (answers.listStatus ?? 200) === 200
          ? Response.json(answers.list ?? [waiting, gone])
          : new Response(null, { status: answers.listStatus }),
      );
    }
    if (part === 'screenshots') {
      return Promise.resolve(Response.json({ image: '/9j/4A==' }));
    }

    return Promise.resolve(
      Response.json({
        ...ticketOf(answers.status ?? 'open'),
        priority: answers.priority ?? 'normal',
        notes: answers.notes ?? [],
      }),
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
      'admin/feedback/index': InboxScreen,
      'admin/feedback/[id]': InboxTicketRoute,
      'admin/feedback/user/[id]': () => <Text>User page</Text>,
      'admin/feedback/note/[id]': AddNoteScreen,
    },
    { initialUrl },
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Feedback inbox', () => {
  test('starts on open tickets, with All first, each with its sender and a dot when it waits for a reply', async () => {
    answerWith();
    await renderAt('/admin/feedback');

    expect(
      await screen.findByRole('button', {
        name: /^Bug, Ana, The rest timer stops\., Open, .*, waiting for a reply$/,
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /^Suggestion, Account deleted, / }),
    ).toBeOnTheScreen();
    expect(screen.getAllByTestId('unread-dot')).toHaveLength(1);
    expect(new URL(mockFetch.mock.calls[0][0].url).search).toBe('?status=open');
    expect(
      screen
        .getAllByRole('button', { name: /^(All|Open|Answered|Closed)$/ })
        .map((chip) => chip.props.accessibilityLabel as string),
    ).toEqual(['All', 'Open', 'Answered', 'Closed']);
  });

  test('a status chip reads its tickets', async () => {
    answerWith();
    await renderAt('/admin/feedback');
    await screen.findByRole('button', { name: /^Bug/ });

    await fireEvent.press(screen.getByRole('button', { name: 'Closed' }));
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => {
      const searches = mockFetch.mock.calls.map(
        ([request]) => new URL(request.url).search,
      );
      expect(searches).toEqual(
        expect.arrayContaining(['?status=open', '?status=closed', '']),
      );
    });
  });

  test('nothing in a status says so', async () => {
    answerWith({ list: [] });
    await renderAt('/admin/feedback');

    expect(await screen.findByText('Nothing open')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    expect(await screen.findByText('No feedback yet')).toBeOnTheScreen();
    expect(screen.getByText('New feedback shows here.')).toBeOnTheScreen();
  });

  test('an inbox that fails says so', async () => {
    answerWith({ listStatus: 500 });
    await renderAt('/admin/feedback');

    expect(
      await screen.findByText('Couldn’t load the inbox.'),
    ).toBeOnTheScreen();
  });

  test('pulling down reads the inbox again', async () => {
    answerWith();
    await renderAt('/admin/feedback');
    await screen.findByRole('button', { name: /^Bug/ });
    mockFetch.mockClear();

    const { refreshControl } = screen.getByTestId('inbox-scroll').props as {
      refreshControl: ReactElement<RefreshControlProps>;
    };
    await act(() => {
      void refreshControl.props.onRefresh?.();
    });

    await waitFor(() => {
      expect(sent('GET', '/api/v1/admin/feedback')).toHaveLength(1);
    });
  });
});

/** Presses a status button, checks its sheet asks, and presses the sheet's button. */
async function confirm(label: string, question: string) {
  await fireEvent.press(await screen.findByRole('button', { name: label }));
  expect(await screen.findByText(question)).toBeOnTheScreen();
  const buttons = screen.getAllByRole('button', { name: label });
  await fireEvent.press(buttons[buttons.length - 1]);
}

describe('A ticket in the inbox', () => {
  test('opens from the inbox with its sender, device and thread, the user’s messages under their name and yours as You', async () => {
    answerWith();
    await renderAt('/admin/feedback');

    await fireEvent.press(await screen.findByRole('button', { name: /^Bug/ }));

    expect(await screen.findByText('ana@example.com')).toBeOnTheScreen();
    // The sender card and the user's message.
    expect(screen.getAllByText('Ana')).toHaveLength(2);
    expect(screen.getByText('You')).toBeOnTheScreen();
    expect(
      screen.getByText('Version 1.0.0 · Google Pixel 8 · Android 15'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Feedback' })).toBeOnTheScreen();
    expect(screen.getByTestId('own-message')).toHaveStyle({
      borderColor: tokens.color.themes.default.colors.primary,
    });
    expect(await screen.findByLabelText('Screenshot 1')).toBeOnTheScreen();
  });

  test('the sender card opens their page with the type as its back link', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');

    await fireEvent.press(
      await screen.findByRole('button', { name: /^Ana, ana@example.com/ }),
    );

    expect(await screen.findByText('User page')).toBeOnTheScreen();
  });

  test('a reply is sent', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');
    await screen.findByText('Which phone is it on?');

    await fireEvent.changeText(
      screen.getByLabelText('Reply'),
      'Fixed in 1.0.1.',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Reply')).toHaveDisplayValue('');
    });
    await expect(
      sent('POST', '/api/v1/admin/feedback/ticket-1/messages')[0]
        .clone()
        .json(),
    ).resolves.toEqual({ message: 'Fixed in 1.0.1.', screenshots: [] });
  });

  test('Close ticket asks first, then closes it', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');

    await confirm('Close ticket', 'Close this ticket?');

    await waitFor(() => {
      expect(
        sent('PUT', '/api/v1/admin/feedback/ticket-1/status'),
      ).toHaveLength(1);
    });
    await expect(
      sent('PUT', '/api/v1/admin/feedback/ticket-1/status')[0].clone().json(),
    ).resolves.toEqual({ status: 'closed' });
  });

  test('a closed ticket reopens, and its reply box says to reopen it first', async () => {
    answerWith({ status: 'closed' });
    await renderAt('/admin/feedback/ticket-1');

    await screen.findByRole('button', { name: 'Reopen ticket' });
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Reopen it to reply.')).toBeOnTheScreen();
    await confirm('Reopen ticket', 'Reopen this ticket?');

    await waitFor(() => {
      expect(
        sent('PUT', '/api/v1/admin/feedback/ticket-1/status'),
      ).toHaveLength(1);
    });
    await expect(
      sent('PUT', '/api/v1/admin/feedback/ticket-1/status')[0].clone().json(),
    ).resolves.toEqual({ status: 'open' });
  });

  test('a status change that fails says so', async () => {
    answerWith({ statusChange: 500 });
    await renderAt('/admin/feedback/ticket-1');

    await confirm('Close ticket', 'Close this ticket?');

    expect(
      await screen.findByText('Couldn’t change the status. Try again.'),
    ).toBeOnTheScreen();
  });

  test('pulling down reads the ticket again', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');
    await screen.findByText('Which phone is it on?');
    mockFetch.mockClear();

    const { refreshControl } = screen.getByTestId('inbox-ticket-scroll')
      .props as { refreshControl: ReactElement<RefreshControlProps> };
    await act(() => {
      void refreshControl.props.onRefresh?.();
    });

    await waitFor(() => {
      expect(sent('GET', '/api/v1/admin/feedback/ticket-1')).toHaveLength(1);
    });
  });

  test('a ticket that fails says so', async () => {
    answerWith();
    mockFetch.mockImplementation(() =>
      Promise.resolve(new Response(null, { status: 500 })),
    );
    await renderAt('/admin/feedback/ticket-1');

    expect(
      await screen.findByText('Couldn’t load this feedback.'),
    ).toBeOnTheScreen();
  });
});

describe('Ticket tools', () => {
  test('a high ticket says so in the inbox', async () => {
    answerWith({ list: [{ ...waiting, priority: 'high' }] });
    await renderAt('/admin/feedback');

    expect(
      await screen.findByRole('button', { name: /, high priority, / }),
    ).toBeOnTheScreen();
    expect(screen.getByText(' · High')).toBeOnTheScreen();
  });

  test('Priority opens its sheet and saves at once', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Priority, Normal' }),
    );
    await fireEvent.press(await screen.findByRole('radio', { name: /^High/ }));

    await waitFor(() => {
      expect(
        sent('PUT', '/api/v1/admin/feedback/ticket-1/priority'),
      ).toHaveLength(1);
    });
    await expect(
      sent('PUT', '/api/v1/admin/feedback/ticket-1/priority')[0].clone().json(),
    ).resolves.toEqual({ priority: 'high' });
  });

  test('notes show oldest first, and a delete asks first', async () => {
    answerWith({
      notes: [
        {
          id: 'note-1',
          text: 'Asked on Discord too.',
          writtenAtUtc: '2026-11-10T09:05:00Z',
        },
      ],
    });
    await renderAt('/admin/feedback/ticket-1');

    expect(await screen.findByText('Asked on Discord too.')).toBeOnTheScreen();
    await confirm('Delete note', 'Delete this note?');

    await waitFor(() => {
      expect(
        sent('DELETE', '/api/v1/admin/feedback/ticket-1/notes/note-1'),
      ).toHaveLength(1);
    });
  });

  test('Add note opens its page with the type as its back link, and saves', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Add note' }),
    );
    expect(await screen.findByRole('link', { name: 'Bug' })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Note'), ' Duplicate. ');
    await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));

    expect(await screen.findByText('Note saved.')).toBeOnTheScreen();
    await expect(
      sent('POST', '/api/v1/admin/feedback/ticket-1/notes')[0].clone().json(),
    ).resolves.toEqual({ text: 'Duplicate.' });
  });

  test('an empty note says so', async () => {
    answerWith();
    await renderAt('/admin/feedback/note/ticket-1?back=Bug');

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Save note' }),
    );

    expect(await screen.findByText('Write a note.')).toBeOnTheScreen();
  });

  test('a saved reply fills the reply with the user’s name', async () => {
    answerWith({
      savedReplies: [
        { id: 'reply-1', title: 'Fixed', text: 'Hi {name}, fixed in 1.0.1.' },
      ],
    });
    await renderAt('/admin/feedback/ticket-1');
    await screen.findByText('Which phone is it on?');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Saved replies' }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Fixed' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Reply')).toHaveDisplayValue(
        'Hi Ana, fixed in 1.0.1.',
      );
    });
  });

  test('without saved replies, the sheet says where to add them', async () => {
    answerWith();
    await renderAt('/admin/feedback/ticket-1');
    await screen.findByText('Which phone is it on?');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Saved replies' }),
    );

    expect(await screen.findByText('Add them in Settings.')).toBeOnTheScreen();
  });
});
