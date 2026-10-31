import { render, screen } from '@testing-library/react-native';
import { Text, useColorScheme } from 'react-native';

import { ThemeProvider, useTheme } from './theme-provider';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockColorScheme = jest.mocked(useColorScheme);

function Background() {
  const theme = useTheme();
  return <Text>{theme.colors.bg}</Text>;
}

test('Match my phone follows the phone', async () => {
  mockColorScheme.mockReturnValue('light');

  await render(
    <ThemeProvider>
      <Background />
    </ThemeProvider>,
  );

  expect(screen.getByText('#F4F5F7')).toBeOnTheScreen();
});

test('Match my phone is dark when the phone sets no scheme', async () => {
  mockColorScheme.mockReturnValue(null);

  await render(
    <ThemeProvider>
      <Background />
    </ThemeProvider>,
  );

  expect(screen.getByText('#050506')).toBeOnTheScreen();
});

test('a chosen theme wins over the phone', async () => {
  mockColorScheme.mockReturnValue('light');

  await render(
    <ThemeProvider theme="dark">
      <Background />
    </ThemeProvider>,
  );

  expect(screen.getByText('#050506')).toBeOnTheScreen();
});

test('useTheme needs a ThemeProvider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);

  await expect(render(<Background />)).rejects.toThrow(
    'useTheme must be used inside ThemeProvider.',
  );
});
