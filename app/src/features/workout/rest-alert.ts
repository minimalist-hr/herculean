import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { useWorkoutSettings } from './use-workout-settings';

const alertId = 'rest-end';
const vibration = [0, 400, 200, 400];

// The rest bar shows while the app is open, but the alert still sounds and vibrates there.
Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

const channelNames = {
  'rest-sound-vibrate': 'Rest alerts',
  'rest-sound-still': 'Rest alerts, sound only',
  'rest-quiet-vibrate': 'Rest alerts, vibrate only',
  'rest-quiet-still': 'Rest alerts, silent',
};

function channelOf(sound: boolean, vibrate: boolean) {
  return `rest-${sound ? 'sound' : 'quiet'}-${vibrate ? 'vibrate' : 'still'}` as const;
}

/**
 * Android sets sound and vibration on a channel and never changes them after, so each mix has its own.
 * Options are left out rather than null: a left-out sound is the phone's default one.
 * If the channel can't be made, the alert still comes on the phone's default channel.
 */
async function prepareChannel(sound: boolean, vibrate: boolean) {
  const id = channelOf(sound, vibrate);
  try {
    await Notifications.setNotificationChannelAsync(id, {
      name: channelNames[id],
      importance: AndroidImportance.HIGH,
      enableVibrate: vibrate,
      ...(vibrate ? { vibrationPattern: vibration } : {}),
      ...(sound ? {} : { sound: null }),
    });

    return id;
  } catch (error) {
    if (__DEV__) {
      console.warn(`Rest alert channel ${id} failed`, error);
    }

    return undefined;
  }
}

/** Asks once, the first time a rest timer starts. After a no, the phone's settings decide. */
async function allowed() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) {
    return current.granted;
  }

  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Alerts when the rest ends, even with the phone locked. A new end time replaces the old one. */
export async function scheduleRestAlert(
  endsAt: number,
  sound: boolean,
  vibrate: boolean,
  workoutId: string,
) {
  if (Platform.OS === 'web' || !(await allowed())) {
    return;
  }
  const channelId =
    Platform.OS === 'android'
      ? await prepareChannel(sound, vibrate)
      : undefined;

  await Notifications.scheduleNotificationAsync({
    identifier: alertId,
    content: {
      title: 'Rest is over',
      body: 'Time for your next set.',
      data: { workoutId },
      sound: sound ? 'default' : false,
      ...(vibrate ? { vibrate: vibration } : {}),
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: endsAt,
      ...(channelId === undefined ? {} : { channelId }),
    },
  });
}

export async function cancelRestAlert() {
  if (Platform.OS !== 'web') {
    await Notifications.cancelScheduledNotificationAsync(alertId);
  }
}

/** Keeps the alert in step with the rest timer: set while it runs, gone once it stops. */
export function useRestAlert(endsAt: number | null, workoutId: string) {
  const settings = useWorkoutSettings().data;
  const sound = settings?.restSound ?? true;
  const vibrate = settings?.restVibrate ?? true;

  useEffect(() => {
    const change =
      endsAt !== null && endsAt > Date.now()
        ? scheduleRestAlert(endsAt, sound, vibrate, workoutId)
        : cancelRestAlert();
    void change.catch((error: unknown) => {
      // A rest alert that can't be set shouldn't stop logging, but it should show while developing.
      if (__DEV__) {
        console.warn('Rest alert failed', error);
      }
    });
  }, [endsAt, sound, vibrate, workoutId]);
}

/** True when the phone blocks Herculean's notifications, so rest alerts can't show. */
export function useRestAlertsBlocked() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    function check() {
      void Notifications.getPermissionsAsync()
        .then((permission) => {
          setBlocked(!permission.granted && !permission.canAskAgain);
        })
        .catch(() => undefined);
    }

    check();
    // Coming back from the phone's settings may find them allowed.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return blocked;
}

/** Tapping a rest alert opens its workout, also when the tap starts the app. */
export function useOpenFromRestAlert() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    function open(response: Notifications.NotificationResponse | null) {
      const workoutId = response?.notification.request.content.data?.workoutId;
      if (typeof workoutId === 'string') {
        // Handled once, so coming back to the tabs doesn't open it again.
        Notifications.clearLastNotificationResponse();
        router.push(
          { pathname: '/workout/log/[id]', params: { id: workoutId } },
          { withAnchor: true },
        );
      }
    }

    open(Notifications.getLastNotificationResponse());
    const subscription =
      Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      subscription.remove();
    };
  }, [router]);
}
