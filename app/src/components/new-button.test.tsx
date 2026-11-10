import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { setFloatingRoom } from './above-tab-bar';
import { NewButton } from './new-button';

let mockPathname = '/exercises';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, right: 0, bottom: 24, left: 0 }),
}));

const onPress = jest.fn();

async function renderButton(muted = false) {
  await render(
    <ThemeProvider theme="dark">
      <NewButton label="New exercise" muted={muted} onPress={onPress} />
    </ThemeProvider>,
  );

  return screen.getByRole('button', { name: 'New exercise' });
}

beforeEach(() => {
  mockPathname = '/exercises';
  setFloatingRoom(0);
  onPress.mockReset();
});

test('sits 16 px above the tab bar, square, and takes a press', async () => {
  const button = await renderButton();

  expect(button).toHaveStyle({ bottom: 16, width: 56, height: 56 });
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalled();
});

test('moves above a floating bar when one shows', async () => {
  await renderButton();

  await act(() => {
    setFloatingRoom(64);
  });

  expect(screen.getByRole('button', { name: 'New exercise' })).toHaveStyle({
    bottom: 72,
  });
});

test('on a page without the tab bar, it sits above the phone’s buttons', async () => {
  mockPathname = '/exercises/groups';

  const button = await renderButton();

  expect(button).toHaveStyle({ bottom: 40 });
});

test('muted, it looks unavailable but still takes a press', async () => {
  const button = await renderButton(true);

  expect(button).toHaveStyle({ opacity: 0.5 });
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalled();
});
