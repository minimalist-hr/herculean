import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { Tappable } from './tappable';

async function renderTappable(feedback?: 'dim' | 'fill' | 'none') {
  const onPress = jest.fn();
  await render(
    <ThemeProvider theme="default">
      <Tappable
        testID="tappable"
        accessibilityRole="button"
        feedback={feedback}
        onPress={onPress}
        style={{ width: 10 }}
      />
    </ThemeProvider>,
  );

  return onPress;
}

function element() {
  return screen.getByTestId('tappable');
}

const touch = {
  persist: () => undefined,
  currentTarget: { measure: () => undefined },
  nativeEvent: {
    timestamp: 1,
    pageX: 0,
    pageY: 0,
    touches: [{ pageX: 0, pageY: 0 }],
    changedTouches: [{ pageX: 0, pageY: 0 }],
  },
};

async function pressDown() {
  await fireEvent(element(), 'responderGrant', touch);
}

test('it keeps its own style at rest, and a press still counts', async () => {
  const onPress = await renderTappable();

  expect(element()).toHaveStyle({ width: 10 });
  expect(element()).not.toHaveStyle({ opacity: 0.7 });

  await fireEvent.press(element());
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('it dims while pressed, and comes back on release', async () => {
  await renderTappable();

  await pressDown();
  expect(element()).toHaveStyle({ width: 10, opacity: 0.7 });

  await fireEvent(element(), 'responderRelease', touch);
  await waitFor(() => {
    expect(element()).not.toHaveStyle({ opacity: 0.7 });
  });
});

test('a row fills while pressed', async () => {
  await renderTappable('fill');

  await pressDown();

  expect(element()).toHaveStyle({ backgroundColor: '#17181B' });
  expect(element()).not.toHaveStyle({ opacity: 0.7 });
});

test('a backdrop stays the same while pressed', async () => {
  await renderTappable('none');

  await pressDown();

  expect(element()).not.toHaveStyle({ opacity: 0.7 });
  expect(element()).not.toHaveStyle({ backgroundColor: '#17181B' });
});
