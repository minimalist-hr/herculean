import { act, fireEvent, screen } from '@testing-library/react-native';
import { Stack, useRouter } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { renderRouter } from 'expo-router/testing-library';
import { BackHandler, Pressable, Text } from 'react-native';

import {
  TabBar,
  tabScreenOptions,
  tabStackSettings,
} from '@/components/tab-bar';
import { ThemeProvider } from '@/theme/theme-provider';

import { useGoBack } from './use-go-back';

type BackPress = () => boolean;

let backPresses: BackPress[] = [];

beforeEach(() => {
  backPresses = [];
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, handler) => {
      backPresses.push(handler as BackPress);
      return {
        remove: () => {
          backPresses = backPresses.filter((press) => press !== handler);
        },
      };
    });
});

/** Like Android: the newest handler runs first, until one handles it. */
function pressBack() {
  [...backPresses].reverse().some((press) => press());
}

function HomeScreen() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open page"
      onPress={() => {
        router.push(
          { pathname: '/exercises/[id]', params: { id: '1' } },
          { withAnchor: true },
        );
      }}
    >
      <Text>Home screen</Text>
    </Pressable>
  );
}

function Page({ openedFromHome }: { openedFromHome: boolean }) {
  useGoBack(openedFromHome);

  return <Text>Opened page</Text>;
}

async function openFromHome(openedFromHome: boolean) {
  await renderRouter(
    {
      _layout: () => (
        <ThemeProvider theme="dark">
          <Tabs
            tabBar={(props) => <TabBar {...props} />}
            screenOptions={tabScreenOptions}
          >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
          </Tabs>
        </ThemeProvider>
      ),
      index: HomeScreen,
      'exercises/_layout': {
        default: () => <Stack screenOptions={{ headerShown: false }} />,
        unstable_settings: tabStackSettings,
      },
      'exercises/index': () => <Text>List screen</Text>,
      'exercises/[id]': () => <Page openedFromHome={openedFromHome} />,
    },
    { initialUrl: '/' },
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Open page' }));
  expect(await screen.findByText('Opened page')).toBeOnTheScreen();
}

test('opened from Home, Android back returns to Home', async () => {
  await openFromHome(true);

  await act(() => {
    pressBack();
    return Promise.resolve();
  });

  expect(await screen.findByText('Home screen')).toBeOnTheScreen();
});

test('opened in its tab, Android back stays in the tab', async () => {
  await openFromHome(false);

  await act(() => {
    pressBack();
    return Promise.resolve();
  });

  expect(await screen.findByText('List screen')).toBeOnTheScreen();
});
