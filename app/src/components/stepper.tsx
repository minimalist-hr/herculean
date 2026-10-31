import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { MinusIcon, PlusIcon } from './icons';

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
  lessLabel,
  moreLabel,
}: StepperProps) {
  const { colors, radius, size, space, text } = useTheme();
  const less = Math.max(min, value - step);
  const more = Math.min(max, value + step);

  return (
    <View style={[styles.row, { gap: space.sm }]}>
      <StepButton
        label={lessLabel}
        disabled={value <= min}
        onPress={() => {
          onChange(less);
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
        disabled={value >= max}
        onPress={() => {
          onChange(more);
        }}
      >
        <PlusIcon color={colors.text} />
      </StepButton>
    </View>
  );
}

interface StepButtonProps {
  label: string;
  /** At the limit, the button is dimmed and does nothing. */
  disabled: boolean;
  onPress: () => void;
  children: ReactNode;
}

function StepButton({ label, disabled, onPress, children }: StepButtonProps) {
  const { colors, opacity, radius, size } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.box,
        {
          width: size.stepper.button,
          height: size.stepper.height,
          borderRadius: radius.control,
          borderColor: colors.border,
          backgroundColor: colors.raised,
          opacity: disabled ? opacity.dimmed : 1,
        },
      ]}
    >
      {children}
    </Pressable>
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
    borderWidth: 1,
  },
  value: {
    flex: 1,
  },
});
