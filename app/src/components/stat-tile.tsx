import { StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '@/components/skeleton';
import { useTheme } from '@/theme/theme-provider';

/** A labelled number in a card. Without a value, it shows a skeleton. */
export function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value?: string;
  /** A small line under the value. */
  detail?: string;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          gap: space.sm,
          padding: size.statTilePadding,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Text style={text.eyebrow}>{label}</Text>
      {value === undefined ? (
        <Skeleton width={90} height={24} />
      ) : (
        <Text style={[text.bigStat, { color: colors.text }]}>{value}</Text>
      )}
      {detail !== undefined && <Text style={text.meta}>{detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
  },
});
