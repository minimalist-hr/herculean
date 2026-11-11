import { Platform } from 'react-native';

import { deviceInfo } from './device-info';

const mockDevice: Record<string, string | null> = {};

jest.mock('expo-device', () => ({
  get manufacturer() {
    return mockDevice.manufacturer;
  },
  get modelName() {
    return mockDevice.modelName;
  },
  get osName() {
    return mockDevice.osName;
  },
  get osVersion() {
    return mockDevice.osVersion;
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.2.3' },
}));

const os = Platform.OS;

afterEach(() => {
  Platform.OS = os;
});

test('a phone sends its maker, model and system', () => {
  Platform.OS = 'android';
  Object.assign(mockDevice, {
    manufacturer: 'Google',
    modelName: 'Pixel 8',
    osName: 'Android',
    osVersion: '15',
  });

  expect(deviceInfo()).toEqual({
    appVersion: '1.2.3',
    phone: 'Google Pixel 8',
    os: 'Android 15',
  });
});

test('an iPhone says iOS', () => {
  Platform.OS = 'ios';
  Object.assign(mockDevice, {
    manufacturer: 'Apple',
    modelName: 'iPhone 15',
    osName: 'iOS',
    osVersion: '18.1',
  });

  expect(deviceInfo().os).toBe('iOS 18.1');
});

test('the web has no phone', () => {
  Platform.OS = 'web';
  Object.assign(mockDevice, {
    manufacturer: null,
    modelName: null,
    osName: 'Windows',
    osVersion: null,
  });

  expect(deviceInfo()).toEqual({
    appVersion: '1.2.3',
    phone: null,
    os: 'Windows',
  });
});

test('a long model name is cut to the API’s limit', () => {
  Platform.OS = 'android';
  Object.assign(mockDevice, {
    manufacturer: 'Maker',
    modelName: 'x'.repeat(200),
    osName: 'Android',
    osVersion: '15',
  });

  expect(deviceInfo().phone).toHaveLength(100);
});
