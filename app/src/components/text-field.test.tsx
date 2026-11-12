import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { TextField } from './text-field';

async function renderField(
  props: Partial<React.ComponentProps<typeof TextField>> = {},
) {
  await render(
    <ThemeProvider theme="default">
      <TextField label="Password" {...props} />
    </ThemeProvider>,
  );
}

test('the helper shows until an error replaces it', async () => {
  await renderField({ helper: 'At least 8 characters.' });
  expect(screen.getByText('At least 8 characters.')).toBeOnTheScreen();

  await renderField({ helper: 'At least 8 characters.', error: 'Too short.' });
  expect(screen.getByText('Too short.')).toBeOnTheScreen();
  expect(screen.queryByText('At least 8 characters.')).toBeNull();
});

test('a password is hidden until the eye shows it', async () => {
  await renderField({ password: true });
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);

  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));

  expect(screen.getByLabelText('Password')).toHaveProp(
    'secureTextEntry',
    false,
  );
  expect(
    screen.getByRole('button', { name: 'Hide password' }),
  ).toBeOnTheScreen();
});
