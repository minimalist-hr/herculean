import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Skeleton } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

/** A routine in a list: its name, a line below it, and what goes before the chevron. */
export function RoutineRow({
  name,
  summary,
  label,
  trailing,
  onPress,
}: {
  name: string;
  summary: string;
  /** What a screen reader says, when it is more than the name and the line below it. */
  label?: string;
  trailing?: ReactNode;
  onPress: () => void;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <Tappable
      feedback="fill"
      accessibilityRole="button"
      accessibilityLabel={label ?? `${name}, ${summary}`}
      onPress={onPress}
      style={[
        styles.row,
        {
          gap: space.md,
          minHeight: size.listRowMin,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={styles.text}>
        <Text style={[text.listItemName, { color: colors.text }]}>{name}</Text>
        <Text style={text.meta}>{summary}</Text>
      </View>
      {trailing}
      <ChevronRightIcon color={colors.muted} size={16} />
    </Tappable>
  );
}

/** A routine row while the list loads. */
export function RoutineRowSkeleton({ width }: { width: number }) {
  const { colors, radius, size, space } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          gap: space.sm,
          minHeight: size.listRowMin,
          paddingHorizontal: space.lg,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <Skeleton width={width} height={14} />
      <Skeleton width={110} height={10} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
  skeleton: {
    justifyContent: 'center',
    borderWidth: 1,
  },
});
