import { fireEvent, screen } from '@testing-library/react-native';
import { Stack, useRouter } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import { renderRouter } from 'expo-router/testing-library';
import { Pressable } from 'react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { HomeIcon, WorkoutIcon } from './icons';
import { PlaceholderScreen } from './placeholder-screen';
import { TabBar } from './tab-bar';

function Layout() {
  return (
    <ThemeProvider theme="dark">
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: HomeIcon }}
        />
        <Tabs.Screen
          name="workout"
          options={{ title: 'Workout', tabBarIcon: WorkoutIcon }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

async function renderTabs() {
  await renderRouter({
    _layout: Layout,
    index: () => <PlaceholderScreen title="Home screen" />,
    workout: () => <PlaceholderScreen title="Workout screen" />,
  });
}

test('shows a tab per screen, with the current one selected', async () => {
  await renderTabs();

  expect(
    screen.getByRole('tab', { name: 'Home', selected: true }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('tab', { name: 'Workout', selected: false }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Home screen')).toBeOnTheScreen();
});

test('keeps at least 8 px below the tabs on phones without a home indicator', async () => {
  await renderTabs();

  expect(screen.getByLabelText('Main')).toHaveStyle({ paddingBottom: 8 });
});

function LayoutWithStack() {
  return (
    <ThemeProvider theme="dark">
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: HomeIcon }}
        />
        <Tabs.Screen
          name="exercises"
          options={{ title: 'Exercises', tabBarIcon: WorkoutIcon }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

function ListScreen() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open details"
      onPress={() => {
        router.push({ pathname: '/exercises/[id]', params: { id: '1' } });
      }}
    />
  );
}

test('pressing the open tab returns to its first page', async () => {
  await renderRouter({
    _layout: LayoutWithStack,
    index: () => <PlaceholderScreen title="Home screen" />,
    'exercises/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
    'exercises/index': ListScreen,
    'exercises/[id]': () => <PlaceholderScreen title="Details screen" />,
  });

  await fireEvent.press(screen.getByRole('tab', { name: 'Exercises' }));
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Open details' }),
  );
  expect(await screen.findByText('Details screen')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('tab', { name: 'Exercises' }));

  expect(
    await screen.findByRole('button', { name: 'Open details' }),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Details screen')).toBeNull();
});

test('pressing a tab opens its screen', async () => {
  await renderTabs();

  await fireEvent.press(screen.getByRole('tab', { name: 'Workout' }));

  expect(await screen.findByText('Workout screen')).toBeOnTheScreen();
  expect(
    screen.getByRole('tab', { name: 'Workout', selected: true }),
  ).toBeOnTheScreen();
});
