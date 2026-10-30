import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Herculean',
  slug: 'herculean',
  version: '1.0.0',
  scheme: 'herculean',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'hr.minimalist.herculean',
    supportsTablet: false,
  },
  android: {
    package: 'hr.minimalist.herculean',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ['expo-router', 'expo-status-bar'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
