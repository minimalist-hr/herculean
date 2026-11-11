import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// The API's limits for each field.
const appVersionMax = 50;
const phoneMax = 100;
const osMax = 50;

const osNames: Partial<Record<typeof Platform.OS, string>> = {
  ios: 'iOS',
  android: 'Android',
};

/** What feedback is sent from: the app's version, the phone and its system. The web has no phone. */
export function deviceInfo() {
  const phone = [Device.manufacturer, Device.modelName]
    .filter((part) => part !== null && part !== '')
    .join(' ');
  const osName = osNames[Platform.OS] ?? Device.osName ?? 'Web';
  const os = [osName, Device.osVersion].filter(Boolean).join(' ');

  return {
    appVersion: (Constants.expoConfig?.version ?? 'unknown').slice(
      0,
      appVersionMax,
    ),
    phone:
      Platform.OS === 'web' || phone === '' ? null : phone.slice(0, phoneMax),
    os: os.slice(0, osMax),
  };
}
