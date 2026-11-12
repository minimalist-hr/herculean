import type { ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { Spinner } from './spinner';
import { Tappable } from './tappable';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** Primary is the screen's main action. Secondary is outlined, for example Cancel. Danger confirms a delete, and danger outline leads to that confirmation. */
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline';
  /** While true, the button shows a spinner and its -ing label, for example "Creating account". */
  waitingLabel?: string;
  waiting?: boolean;
  /** Another action on the screen is waiting, so this one can't be pressed. */
  dimmed?: boolean;
  /** It isn't available yet, but a press can say why. */
  muted?: boolean;
  /** Shows before the label, for example a plus. */
  icon?: (props: { color: string; size: number }) => ReactNode;
  /** As tall as the smallest touch target, for a bar with little room. */
  /** Smaller, for a floating bar. Its tap area stays 44 px. */
  compact?: boolean;
  /** As tall as a text field, to sit beside one in a row. */
  fieldHeight?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  waitingLabel,
  waiting = false,
  dimmed = false,
  muted = false,
  icon,
  compact = false,
  fieldHeight = false,
}: ButtonProps) {
  const { colors, line, opacity, radius, size, space, text } = useTheme();
  const filled = variant === 'primary' || variant === 'danger';
  const textColor = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: colors.onDanger,
    dangerOutline: colors.danger,
  }[variant];

  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: waiting || dimmed, busy: waiting }}
      disabled={waiting || dimmed}
      onPress={onPress}
      style={[
        styles.button,
        {
          gap: space.sm,
          paddingHorizontal: space.md,
          borderRadius: radius.control,
          opacity: dimmed || muted ? opacity.dimmed : 1,
        },
        filled
          ? {
              height: compact
                ? size.floatingBar.control
                : fieldHeight
                  ? size.input
                  : size.primaryButton,
              backgroundColor:
                variant === 'danger' ? colors.dangerFill : colors.primary,
            }
          : [
              styles.outlined,
              {
                borderWidth: line,
                height: size.secondaryButton,
                backgroundColor: colors.raised,
                borderColor: colors.border,
              },
            ],
      ]}
    >
      {waiting && <Spinner color={textColor} />}
      {icon?.({ color: textColor, size: 16 })}
      <Text
        style={[
          filled && !compact && !fieldHeight
            ? text.primaryButton
            : text.secondaryButton,
          { color: textColor },
        ]}
      >
        {waiting && waitingLabel !== undefined ? waitingLabel : label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {},
});
