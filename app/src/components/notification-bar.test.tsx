import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { ThemeProvider } from '@/theme/theme-provider';

import { NotificationBar } from './notification-bar';
import { notifyFailure, notifySuccess } from './notifications';
import { PlaceholderScreen } from './placeholder-screen';

function Layout() {
  return (
    <ThemeProvider theme="dark">
      <Stack screenOptions={{ headerShown: false }} />
      <NotificationBar />
    </ThemeProvider>
  );
}

async function renderBar() {
  await renderRouter({
    _layout: Layout,
    index: () => <PlaceholderScreen title="Screen" />,
  });
}

afterEach(() => {
  jest.useRealTimers();
});

test('shows nothing until something is notified', async () => {
  await renderBar();

  expect(screen.queryByRole('alert')).toBeNull();
});

test('shows a success and a failure, the newest replacing the last', async () => {
  await renderBar();

  await act(() => {
    notifySuccess('Bench press saved.');
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Bench press saved.');
  expect(screen.getByText('Bench press saved.')).toHaveStyle({
    color: '#F2F3F5',
  });

  await act(() => {
    notifyFailure('Couldn’t save the exercise. Try again.');
  });
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Couldn’t save the exercise. Try again.',
  );
});

test('a tap dismisses it', async () => {
  await renderBar();
  await act(() => {
    notifySuccess('Bench press saved.');
  });

  await fireEvent.press(screen.getByRole('alert'));

  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

test.each([
  ['a success', notifySuccess, 4000],
  ['a failure', notifyFailure, 6000],
])('%s goes away on its own in time', async (_name, notify, wait) => {
  await renderBar();
  jest.useFakeTimers();

  await act(() => {
    notify('Message');
  });
  await act(() => {
    jest.advanceTimersByTime(wait - 1);
  });
  expect(screen.getByRole('alert')).toBeOnTheScreen();

  await act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.queryByRole('alert')).toBeNull();
});

test('it sits at the top of the screen', async () => {
  await renderBar();
  await act(() => {
    notifySuccess('Bench press saved.');
  });

  expect(screen.getByTestId('notification-bar')).toHaveStyle({ top: 8 });
});
