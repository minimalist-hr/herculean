import 'react-native-gesture-handler/jestSetup';

// Notifications need the phone. A test that checks them reads these mocks.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, canAskAgain: true }),
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, canAskAgain: true }),
  ),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('rest-end')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

// Tests talk to a fake API address. Each test answers the requests itself.
process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
