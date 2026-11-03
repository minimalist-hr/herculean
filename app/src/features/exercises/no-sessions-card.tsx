import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Stands where sessions and progress show once there are some. */
export function NoSessionsCard({ message }: { message: string }) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.sm,
          paddingVertical: size.gap.sectionMax,
          paddingHorizontal: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[text.listItemName, { color: colors.text }]}>
        No sessions yet
      </Text>
      <Text style={[text.meta, styles.message]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  message: {
    textAlign: 'center',
  },
});
