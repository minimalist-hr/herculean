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
  // The browser is for development only. The product is the phone app.
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-localization',
    [
      'expo-image-picker',
      {
        cameraPermission:
          'Herculean uses the camera to take your profile photo.',
        photosPermission:
          'Herculean uses your photos to set your profile photo.',
        microphonePermission: false,
      },
    ],
    // Only the background. The launch screen draws the logo and its glow.
    [
      'expo-splash-screen',
      { backgroundColor: '#F4F5F7', dark: { backgroundColor: '#050506' } },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
