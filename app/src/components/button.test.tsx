import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

import { Button } from './button';

async function renderButton(
  props: Partial<React.ComponentProps<typeof Button>> = {},
) {
  const onPress = jest.fn();
  await render(
    <ThemeProvider theme="default">
      <Button
        label="Save set"
        waitingLabel="Saving set"
        onPress={onPress}
        {...props}
      />
    </ThemeProvider>,
  );
  return onPress;
}

test('a button does its action when pressed', async () => {
  const onPress = await renderButton({ variant: 'secondary' });

  await fireEvent.press(screen.getByRole('button', { name: 'Save set' }));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('a waiting button shows its -ing label and cannot be pressed again', async () => {
  const onPress = await renderButton({ waiting: true });

  expect(screen.getByText('Saving set')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Save set' }));
  expect(onPress).not.toHaveBeenCalled();
});
