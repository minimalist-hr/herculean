import 'react-native-gesture-handler/jestSetup';

// Tests talk to a fake API address. Each test answers the requests itself.
process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
