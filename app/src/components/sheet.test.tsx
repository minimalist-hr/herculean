import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { useState } from 'react';
import { Keyboard, Text } from 'react-native';
import { State } from 'react-native-gesture-handler';
import {
  fireGestureHandler,
  getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';

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

async function pullBody(translationY: number, velocityY = 0) {
  await act(() => {
    fireGestureHandler(getByGestureTestId('sheet-body'), [
      { state: State.BEGAN },
      { state: State.ACTIVE, translationY: 10 },
      { translationY: 10 },
      { translationY },
      { state: State.END, translationY, velocityY },
    ]);
  });
  // The end of a pull reaches JavaScript a moment later.
  await act(async () => {
    await jest.advanceTimersByTimeAsync(50);
  });
}

test('a long pull down on the body closes it', async () => {
  await renderSheet();
  await measure();

  await pullBody(400);

  await waitFor(() => {
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

test('a quick flick down on the body closes it', async () => {
  await renderSheet();
  await measure();

  await pullBody(30, 2000);

  await waitFor(() => {
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

test('a short slow pull down on the body springs back', async () => {
  await renderSheet();
  await measure();

  await pullBody(30);

  expect(onClose).not.toHaveBeenCalled();
});

test('a pull down on a body scrolled away from its top only scrolls it', async () => {
  await renderSheet();
  await measure();
  await fireEvent.scroll(screen.getByText('Field'), {
    nativeEvent: {
      contentOffset: { y: 80 },
      contentSize: { height: 800, width: 300 },
      layoutMeasurement: { height: 300, width: 300 },
    },
  });

  await pullBody(400);

  expect(onClose).not.toHaveBeenCalled();
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

test('a sheet can keep its actions above the keyboard', async () => {
  await renderRouter({
    _layout: Layout,
    index: () => (
      <Sheet
        visible
        title="Delete your account?"
        onClose={onClose}
        actionsAboveKeyboard
        body={<Text>Field</Text>}
      >
        <Button label="Delete account" onPress={jest.fn()} />
      </Sheet>
    ),
  });
  await measure();

  await emitKeyboard('keyboardDidShow', 300);

  expect(
    screen.getByRole('button', { name: 'Delete account' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Field')).toBeOnTheScreen();
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

test('a failure shows once, over the sheet', async () => {
  await renderSheet();
  await measure();

  await act(() => {
    notifyFailure('Couldn’t save the group. Try again.');
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Couldn’t save the group. Try again.',
  );
});

test('a success shows once', async () => {
  await renderSheet();
  await measure();

  await act(() => {
    notifySuccess('Pecs saved.');
  });

  expect(screen.getByRole('alert')).toHaveTextContent('Pecs saved.');
});

test('a failure goes when its sheet closes', async () => {
  await renderRouter({ _layout: Layout, index: ClosableSheet });

  await act(() => {
    notifyFailure('Couldn’t save the group. Try again.');
  });
  expect(screen.getByRole('alert')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

  await waitFor(() => {
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
