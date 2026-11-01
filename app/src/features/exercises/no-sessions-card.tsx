import { StyleSheet, Text, View } from 'react-native';

import { HistoryIcon } from '@/components/icons';
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
          paddingTop: 28,
          paddingBottom: size.gap.sectionMax,
          paddingHorizontal: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
        },
      ]}
    >
      <HistoryIcon color={colors.muted} size={28} />
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
