import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

/** Stands where something will show once there is some. */
export function EmptyCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const { colors, radius, space, text } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          gap: space.xs,
          padding: space.xl,
          borderRadius: radius.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[text.listItemName, styles.centered, { color: colors.text }]}
      >
        {title}
      </Text>
      <Text style={[text.meta, styles.centered]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centered: {
    textAlign: 'center',
  },
});
