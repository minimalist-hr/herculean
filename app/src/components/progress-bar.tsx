import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** A thin bar that fills with how much is done. The text beside it says the numbers, so screen readers skip it. */
export function ProgressBar({ done, total }: { done: number; total: number }) {
  const { colors } = useTheme();
  const percent = total === 0 ? 0 : (done / total) * 100;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { backgroundColor: colors.border }]}
    >
      <View
        testID="progress-fill"
        style={[
          styles.fill,
          { width: `${String(percent)}%`, backgroundColor: colors.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
  },
});
