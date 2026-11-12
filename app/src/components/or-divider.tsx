import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** A line with "or" in the middle, between two ways to do the same thing. */
export function OrDivider() {
  const { colors, space, text } = useTheme();
  const line = [styles.line, { backgroundColor: colors.border }];

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.row, { gap: space.md }]}
    >
      <View style={line} />
      <Text style={[text.meta, { color: colors.muted }]}>or</Text>
      <View style={line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
