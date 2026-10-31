import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { Spinner } from './spinner';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** Primary is the screen's main action. Secondary is outlined, for example Cancel. */
  variant?: 'primary' | 'secondary';
  /** While true, the button shows a spinner and its -ing label, for example "Creating account". */
  waitingLabel?: string;
  waiting?: boolean;
  /** Another action on the screen is waiting, so this one can't be pressed. */
  dimmed?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  waitingLabel,
  waiting = false,
  dimmed = false,
}: ButtonProps) {
  const { colors, opacity, radius, size, space, text } = useTheme();
  const primary = variant === 'primary';
  const textColor = primary ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: waiting || dimmed, busy: waiting }}
      disabled={waiting || dimmed}
      onPress={onPress}
      style={[
        styles.button,
        {
          gap: space.sm,
          borderRadius: radius.control,
          opacity: dimmed ? opacity.dimmed : 1,
        },
        primary
          ? { height: size.primaryButton, backgroundColor: colors.primary }
          : [
              styles.outlined,
              {
                height: size.secondaryButton,
                backgroundColor: colors.raised,
                borderColor: colors.border,
              },
            ],
      ]}
    >
      {waiting && <Spinner color={textColor} />}
      <Text
        style={[
          primary ? text.primaryButton : text.secondaryButton,
          { color: textColor },
        ]}
      >
        {waiting && waitingLabel !== undefined ? waitingLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderWidth: 1,
  },
});
