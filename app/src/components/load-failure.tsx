import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { PlaceholderBox } from './placeholder-box';
import { TextLink } from './text-link';

/** Says something didn't load, in its place, and offers to read it again. */
export function LoadFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { colors, space, text } = useTheme();

  return (
    // Try again's touch area already adds room below it, so the box looks even.
    <PlaceholderBox roomBelow={space.sm}>
      <Text
        accessibilityRole="alert"
        style={[text.body, styles.centered, { color: colors.muted }]}
      >
        {message}
      </Text>
      <TextLink label="Try again" onPress={onRetry} />
    </PlaceholderBox>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
});
