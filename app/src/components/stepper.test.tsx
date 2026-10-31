import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatClock, formatSpokenDuration } from '@/formats/formats';
import { ThemeProvider } from '@/theme/theme-provider';

import { Stepper } from './stepper';

async function renderStepper(value: number) {
  const onChange = jest.fn();
  await render(
    <ThemeProvider theme="dark">
      <Stepper
        label="Default rest time"
        value={value}
        onChange={onChange}
        min={15}
        max={600}
        step={15}
        format={formatClock}
        formatSpoken={formatSpokenDuration}
        lessLabel="15 seconds less"
        moreLabel="15 seconds more"
      />
    </ThemeProvider>,
  );
  return onChange;
}

test('the buttons step the value', async () => {
  const onChange = await renderStepper(90);

  await fireEvent.press(
    screen.getByRole('button', { name: '15 seconds less' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: '15 seconds more' }),
  );

  expect(onChange.mock.calls).toEqual([[75], [105]]);
});

test('at a limit its button is disabled', async () => {
  await renderStepper(15);

  expect(
    screen.getByRole('button', { name: '15 seconds less' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: '15 seconds more' })).toBeEnabled();
});

test('screen readers adjust it as one control', async () => {
  const onChange = await renderStepper(600);
  const stepper = screen.getByRole('adjustable', { name: 'Default rest time' });

  expect(stepper).toHaveAccessibilityValue({ text: '10 minutes' });
  await fireEvent(stepper, 'accessibilityAction', {
    nativeEvent: { actionName: 'increment' },
  });
  await fireEvent(stepper, 'accessibilityAction', {
    nativeEvent: { actionName: 'decrement' },
  });

  expect(onChange.mock.calls).toEqual([[600], [585]]);
});
