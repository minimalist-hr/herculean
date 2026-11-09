import { StyleSheet, Text, View } from 'react-native';

import { TextLink } from '@/components/text-link';
import { useTheme } from '@/theme/theme-provider';

/** The groups couldn't load: the list still shows, and this takes the chips' place. */
export function ChipsFailure({ onRetry }: { onRetry: () => void }) {
  const { colors, size, space, text } = useTheme();

  return (
    <View
      style={[
        styles.failure,
        { height: size.chip, gap: space.xs, paddingLeft: space.sm },
      ]}
    >
      <Text
        accessibilityRole="alert"
        style={[text.meta, { color: colors.muted }]}
      >
        Couldn’t load your groups.
      </Text>
      <TextLink label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  failure: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
