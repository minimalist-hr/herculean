import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { MinusIcon, PlusIcon } from './icons';
import { notifyFailure } from './notifications';
import { Tappable } from './tappable';

interface StepperProps {
  /** Names the value for screen readers, for example "Default rest time". */
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** How the value shows, for example 90 → "1:30". */
  format: (value: number) => string;
  /** How screen readers say the value, for example "1 minute 30 seconds". */
  formatSpoken: (value: number) => string;
  /** How a limit reads in the notification, for example 20 → "20 sets". */
  formatLimit: (value: number) => string;
  /** The button labels, for example "15 seconds less" and "15 seconds more". */
  lessLabel: string;
  moreLabel: string;
}

/** − and + around a value. Screen readers get one adjustable control. */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  formatSpoken,
  formatLimit,
  lessLabel,
  moreLabel,
}: StepperProps) {
  const { colors, line, radius, size, space, text } = useTheme();
  const less = Math.max(min, value - step);
  const more = Math.min(max, value + step);

  return (
    <View style={[styles.row, { gap: space.sm }]}>
      <StepButton
        label={lessLabel}
        muted={value <= min}
        onPress={() => {
          if (value <= min) {
            notifyFailure(`At least ${formatLimit(min)}.`);
          } else {
            onChange(less);
          }
        }}
      >
        <MinusIcon color={colors.text} />
      </StepButton>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: formatSpoken(value) }}
        accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
        onAccessibilityAction={(event) => {
          onChange(event.nativeEvent.actionName === 'increment' ? more : less);
        }}
        style={[
          styles.box,
          styles.value,
          {
            borderWidth: line,
            height: size.stepper.height,
            borderRadius: radius.control,
            borderColor: colors.border,
            backgroundColor: colors.raised,
          },
        ]}
      >
        <Text style={[text.stepperValue, { color: colors.text }]}>
          {format(value)}
        </Text>
      </View>
      <StepButton
        label={moreLabel}
        muted={value >= max}
        onPress={() => {
          if (value >= max) {
            notifyFailure(`At most ${formatLimit(max)}.`);
          } else {
            onChange(more);
          }
        }}
      >
        <PlusIcon color={colors.text} />
      </StepButton>
    </View>
  );
}

interface StepButtonProps {
  label: string;
  /** At the limit, the button looks muted, and a press says why. */
  muted: boolean;
  onPress: () => void;
  children: ReactNode;
}

function StepButton({ label, muted, onPress, children }: StepButtonProps) {
  const { colors, line, opacity, radius, size } = useTheme();

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={
        muted ? `${label}, not available at the limit` : label
      }
      onPress={onPress}
      style={[
        styles.box,
        {
          borderWidth: line,
          width: size.stepper.button,
          height: size.stepper.height,
          borderRadius: radius.control,
          borderColor: colors.border,
          backgroundColor: colors.raised,
          opacity: muted ? opacity.dimmed : 1,
        },
      ]}
    >
      {children}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    flex: 1,
  },
});
