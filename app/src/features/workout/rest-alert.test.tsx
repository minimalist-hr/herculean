import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReactNode } from 'react';

import { createTestQueryClient } from '@/test-utils/query-client';

import {
  useOpenFromRestAlert,
  useRestAlert,
  useRestAlertsBlocked,
} from './rest-alert';
import { workoutKeys } from './query-keys';

const notifications = jest.mocked(Notifications);
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

function permission(granted: boolean, canAskAgain = true) {
  return { granted, canAskAgain } as Awaited<
    ReturnType<typeof Notifications.getPermissionsAsync>
  >;
}

async function renderAlert(
  endsAt: number | null,
  settings = { restSound: true, restVibrate: true },
) {
  const client = createTestQueryClient();
  client.setQueryData(workoutKeys.settings, {
    defaultRestSeconds: 180,
    ...settings,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return renderHook(
    ({ ends }: { ends: number | null }) => {
      useRestAlert(ends, 'w1');
    },
    {
      wrapper,
      initialProps: { ends: endsAt },
    },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue(permission(true));
});

/** The alert that was scheduled last. */
function scheduled() {
  const calls = notifications.scheduleNotificationAsync.mock.calls;

  return calls[calls.length - 1][0];
}

test('a running rest schedules its alert for when it ends', async () => {
  const endsAt = Date.now() + 90_000;
  await renderAlert(endsAt);

  await waitFor(() => {
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
  const alert = scheduled();
  expect(alert.identifier).toBe('rest-end');
  expect(alert.content.title).toBe('Rest is over');
  expect(alert.content.data).toEqual({ workoutId: 'w1' });
  expect(alert.trigger).toMatchObject({ date: endsAt });
});

test('on Android the settings choose a channel, with no empty options', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await renderAlert(Date.now() + 90_000, {
    restSound: false,
    restVibrate: true,
  });

  await waitFor(() => {
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
  const [id, options] = notifications.setNotificationChannelAsync.mock.calls[0];
  expect(id).toBe('rest-quiet-vibrate');
  expect(options).toMatchObject({ enableVibrate: true, sound: null });
  expect(scheduled().content.sound).toBe(false);
  expect(scheduled().trigger).toMatchObject({
    channelId: 'rest-quiet-vibrate',
  });
});

test('a channel with sound leaves the sound out, so the phone plays its own', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  await renderAlert(Date.now() + 90_000, {
    restSound: true,
    restVibrate: false,
  });

  await waitFor(() => {
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalled();
  });
  const options = notifications.setNotificationChannelAsync.mock.calls[0][1];
  expect(Object.keys(options)).not.toContain('sound');
  expect(Object.keys(options)).not.toContain('vibrationPattern');
});

test('when the channel fails, the alert still comes on the default one', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  notifications.setNotificationChannelAsync.mockRejectedValueOnce(
    new Error('No channel'),
  );

  await renderAlert(Date.now() + 90_000);

  await waitFor(() => {
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });
  expect(Object.keys(scheduled().trigger ?? {})).not.toContain('channelId');
});

test('a stopped rest cancels its alert', async () => {
  const view = await renderAlert(Date.now() + 90_000);
  await waitFor(() => {
    expect(notifications.scheduleNotificationAsync).toHaveBeenCalled();
  });

  await view.rerender({ ends: null });

  await waitFor(() => {
    expect(notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'rest-end',
    );
  });
});

test('it asks first, and a no schedules nothing', async () => {
  notifications.getPermissionsAsync.mockResolvedValue(permission(false));
  notifications.requestPermissionsAsync.mockResolvedValue(
    permission(false, false),
  );

  await renderAlert(Date.now() + 90_000);

  await waitFor(() => {
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
  });
  expect(notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('after a no, it does not ask again', async () => {
  notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));

  await renderAlert(Date.now() + 90_000);

  await waitFor(() => {
    expect(notifications.getPermissionsAsync).toHaveBeenCalled();
  });
  expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

test('blocked notifications are noticed', async () => {
  notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));

  const { result } = await renderHook(() => useRestAlertsBlocked());

  await waitFor(() => {
    expect(result.current).toBe(true);
  });
});

function tapped(workoutId: unknown) {
  return {
    notification: { request: { content: { data: { workoutId } } } },
  } as unknown as Notifications.NotificationResponse;
}

test('tapping a rest alert opens its workout', async () => {
  await renderHook(() => {
    useOpenFromRestAlert();
  });
  const listener =
    notifications.addNotificationResponseReceivedListener.mock.calls[0][0];

  listener(tapped('w1'));

  expect(mockPush).toHaveBeenCalledWith(
    { pathname: '/workout/log/[id]', params: { id: 'w1' } },
    { withAnchor: true },
  );
  expect(notifications.clearLastNotificationResponse).toHaveBeenCalled();
});

test('a tap that started the app opens the workout once it is up', async () => {
  notifications.getLastNotificationResponse.mockReturnValueOnce(tapped('w1'));

  await renderHook(() => {
    useOpenFromRestAlert();
  });

  expect(mockPush).toHaveBeenCalledWith(
    { pathname: '/workout/log/[id]', params: { id: 'w1' } },
    { withAnchor: true },
  );
});

test('another notification opens nothing', async () => {
  notifications.getLastNotificationResponse.mockReturnValueOnce(tapped(42));

  await renderHook(() => {
    useOpenFromRestAlert();
  });

  expect(mockPush).not.toHaveBeenCalled();
});
