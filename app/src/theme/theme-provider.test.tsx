import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider, useTheme } from './theme-provider';

function Background() {
  const theme = useTheme();
  return <Text>{theme.colors.bg}</Text>;
}

test('Default shows until a theme is chosen', async () => {
  await render(
    <ThemeProvider>
      <Background />
    </ThemeProvider>,
  );

  expect(screen.getByText('#050506')).toBeOnTheScreen();
});

test('a chosen theme shows, whatever the phone’s setting', async () => {
  await render(
    <ThemeProvider theme="latte">
      <Background />
    </ThemeProvider>,
  );

  expect(screen.getByText('#FAF9F5')).toBeOnTheScreen();
});

test('useTheme needs a ThemeProvider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);

  await expect(render(<Background />)).rejects.toThrow(
    'useTheme must be used inside ThemeProvider.',
  );
});
