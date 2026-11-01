import { StyleSheet, Text, View } from 'react-native';

import { TextLink } from '@/components/text-link';
import { useTheme } from '@/theme/theme-provider';

/** Says an exercise didn't load, and offers to read it again. */
export function ExerciseLoadFailure({ onRetry }: { onRetry: () => void }) {
  const { colors, space, text } = useTheme();

  return (
    <View style={[styles.failure, { paddingTop: space.xl }]}>
      <Text
        accessibilityRole="alert"
        style={[text.body, { color: colors.muted }]}
      >
        Couldn&apos;t load this exercise.
      </Text>
      <TextLink label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  failure: {
    alignItems: 'center',
  },
});
