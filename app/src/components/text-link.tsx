import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { Tappable } from './tappable';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  /** Another action on the screen is waiting, so this one can't be pressed. */
  dimmed?: boolean;
  /** Not available: it looks muted but stays tappable, so it can say why. */
  muted?: boolean;
}

/** A link styled as text, for example "Forgot password?" or "Sign in". Its padding makes the touch target. */
export function TextLink({
  label,
  onPress,
  dimmed = false,
  muted = false,
}: TextLinkProps) {
  const { colors, opacity, size, space, text } = useTheme();

  return (
    <Tappable
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
          opacity: dimmed || muted ? opacity.dimmed : 1,
        },
      ]}
    >
      <Text style={[text.secondaryButton, { color: colors.primaryText }]}>
        {label}
      </Text>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  link: {
    justifyContent: 'center',
  },
});
