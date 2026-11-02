import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Keyboard, Text } from 'react-native';

import { dragBy } from '@/test-utils/drag';
import { ThemeProvider } from '@/theme/theme-provider';

import { Button } from './button';
import { NotificationBar } from './notification-bar';
import { notifyFailure, notifySuccess } from './notifications';
import { Sheet } from './sheet';

const onClose = jest.fn();
let addListener: jest.SpiedFunction<typeof Keyboard.addListener>;

function Layout() {
  return (
    <ThemeProvider theme="dark">
      <Stack screenOptions={{ headerShown: false }} />
      <NotificationBar />
    </ThemeProvider>
  );
}

async function renderSheet() {
  await renderRouter({
    _layout: Layout,
    index: () => (
      <Sheet
        visible
        title="Rename group"
        message="The new name shows everywhere."
        onClose={onClose}
        body={<Text>Field</Text>}
      >
        <Button label="Save group" onPress={jest.fn()} />
      </Sheet>
    ),
  });
}

function ClosableSheet() {
  const [visible, setVisible] = useState(true);

  return (
    <Sheet
      visible={visible}
      title="Rename group"
      message="The new name shows everywhere."
      onClose={onClose}
    >
      <Button
        label="Cancel"
        onPress={() => {
          setVisible(false);
        }}
      />
    </Sheet>
  );
}

/** Tells the sheet how tall its parts are, which only a device can measure. */
async function measure() {
  await fireEvent(screen.getByTestId('sheet-drag'), 'layout', {
    nativeEvent: { layout: { height: 100 } },
  });
  await fireEvent(screen.getByTestId('sheet-actions'), 'layout', {
    nativeEvent: { layout: { height: 100 } },
  });
}

function emitKeyboard(event: string, height = 0) {
  const listeners = addListener.mock.calls.filter(([name]) => name === event);

  return act(() => {
    for (const [, listener] of listeners) {
      listener({ endCoordinates: { height } } as never);
    }
  });
}

beforeEach(() => {
  onClose.mockReset();
  addListener = jest.spyOn(Keyboard, 'addListener');
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows its heading, body and actions', async () => {
  await renderSheet();

  expect(
    screen.getByRole('header', { name: 'Rename group' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Field')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Save group' })).toBeOnTheScreen();
});

test('a long pull down closes it', async () => {
  await renderSheet();
  await measure();

  await dragBy(screen.getByTestId('sheet-drag'), 400);

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('a short slow pull down springs back', async () => {
  await renderSheet();
  await measure();

  await dragBy(screen.getByTestId('sheet-drag'), 20, 20);

  expect(onClose).not.toHaveBeenCalled();
});

test('a pull up does nothing', async () => {
  await renderSheet();
  await measure();

  await dragBy(screen.getByTestId('sheet-drag'), -300);

  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save group' })).toBeOnTheScreen();
});

test('the actions wait behind the keyboard', async () => {
  await renderSheet();
  await measure();

  await emitKeyboard('keyboardDidShow', 300);

  expect(screen.queryByRole('button', { name: 'Save group' })).toBeNull();
  expect(screen.getByText('Field')).toBeOnTheScreen();

  await emitKeyboard('keyboardDidHide');

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Save group' }),
    ).toBeOnTheScreen();
  });
});

/** The bar a sheet shows has moved above the sheet's height. The app's own hasn't. */
function barBottom() {
  const bar = screen.getByTestId('notification-bar');
  const style = bar.props.style as { bottom?: number };

  return style.bottom;
}

test('a failure shows once, above the sheet', async () => {
  await renderSheet();
  await measure();

  await act(() => {
    notifyFailure("Couldn't save the group. Try again.");
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    "Couldn't save the group. Try again.",
  );
  expect(barBottom()).toBeGreaterThan(200);
});

test('a success shows once, in its usual place', async () => {
  await renderSheet();
  await measure();

  await act(() => {
    notifySuccess('Pecs saved.');
  });

  expect(screen.getByRole('alert')).toHaveTextContent('Pecs saved.');
  expect(barBottom()).toBe(80);
});

test('a failure goes when its sheet closes', async () => {
  await renderRouter({ _layout: Layout, index: ClosableSheet });

  await act(() => {
    notifyFailure("Couldn't save the group. Try again.");
  });
  expect(screen.getByRole('alert')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
