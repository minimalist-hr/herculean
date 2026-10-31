import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  /** Another action on the screen is waiting, so this one can't be pressed. */
  dimmed?: boolean;
}

/** A link styled as text, for example "Forgot password?" or "Sign in". Its padding makes the touch target. */
export function TextLink({ label, onPress, dimmed = false }: TextLinkProps) {
  const { colors, opacity, size, space, text } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dimmed }}
      disabled={dimmed}
      onPress={onPress}
      style={[
        styles.link,
        {
          minHeight: size.touchTargetMin,
          paddingHorizontal: space.sm,
          opacity: dimmed ? opacity.dimmed : 1,
        },
      ]}
    >
      <Text style={[text.secondaryButton, { color: colors.primaryText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    justifyContent: 'center',
  },
});
