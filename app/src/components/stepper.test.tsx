import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatClock, formatSpokenDuration } from '@/formats/formats';
import { ThemeProvider } from '@/theme/theme-provider';

import { notifyFailure } from './notifications';
import { Stepper } from './stepper';

jest.mock('./notifications');

async function renderStepper(value: number) {
  const onChange = jest.fn();
  await render(
    <ThemeProvider theme="default">
      <Stepper
        label="Default rest time"
        value={value}
        onChange={onChange}
        min={15}
        max={600}
        step={15}
        format={formatClock}
        formatSpoken={formatSpokenDuration}
        formatLimit={formatClock}
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

test('at the lowest value, less says why and changes nothing', async () => {
  const onChange = await renderStepper(15);

  await fireEvent.press(
    screen.getByRole('button', {
      name: '15 seconds less, not available at the limit',
    }),
  );

  expect(notifyFailure).toHaveBeenCalledWith('At least 0:15.');
  expect(onChange).not.toHaveBeenCalled();
});

test('at the highest value, more says why and changes nothing', async () => {
  const onChange = await renderStepper(600);

  await fireEvent.press(
    screen.getByRole('button', {
      name: '15 seconds more, not available at the limit',
    }),
  );

  expect(notifyFailure).toHaveBeenCalledWith('At most 10:00.');
  expect(onChange).not.toHaveBeenCalled();
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
