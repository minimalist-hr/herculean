import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { SectionTitle } from './section-title';

test('screen readers read it as a heading', async () => {
  await render(
    <ThemeProvider theme="dark">
      <SectionTitle>Used in</SectionTitle>
    </ThemeProvider>,
  );

  expect(screen.getByRole('header', { name: 'Used in' })).toBeOnTheScreen();
});
