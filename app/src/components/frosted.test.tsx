import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme/theme-provider';
import type { ThemeName } from '@/theme/theme';

import { Frosted, useSurfaceColor } from './frosted';

function Surface() {
  const color = useSurfaceColor('#1C1C1E');

  return (
    <>
      <Frosted color="#1C1C1E" />
      <Text>{color}</Text>
    </>
  );
}

async function renderIn(theme: ThemeName) {
  await render(
    <ThemeProvider theme={theme}>
      <Surface />
    </ThemeProvider>,
  );
}

test.each<ThemeName>(['smoke', 'frost'])(
  '%s frosts a surface and clears its own color',
  async (theme) => {
    await renderIn(theme);

    expect(screen.getByTestId('frosted')).toBeOnTheScreen();
    expect(screen.getByText('transparent')).toBeOnTheScreen();
  },
);

test('other themes keep the surface solid', async () => {
  await renderIn('default');

  expect(screen.queryByTestId('frosted')).toBeNull();
  expect(screen.getByText('#1C1C1E')).toBeOnTheScreen();
});
