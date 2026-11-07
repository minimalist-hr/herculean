import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { TextLink } from './text-link';

/** Says something didn't load, in its place, and offers to read it again. */
export function LoadFailure({
  message,
  onRetry,
  inline = false,
}: {
  message: string;
  onRetry: () => void;
  /** One line for a part of a screen, with Try again beside the message. */
  inline?: boolean;
}) {
  const { colors, space, text } = useTheme();

  return (
    <View
      style={
        inline
          ? [styles.inline, { gap: space.sm }]
          : [styles.failure, { paddingTop: space.xl }]
      }
    >
      <Text
        accessibilityRole="alert"
        style={[text.body, { color: colors.muted }]}
      >
        {message}
      </Text>
      <TextLink label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  failure: {
    alignItems: 'center',
  },
  inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
