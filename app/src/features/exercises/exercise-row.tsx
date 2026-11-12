import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { ChevronRightIcon } from '@/components/icons';
import { formatSet, formatShortDate } from '@/formats/formats';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';
import { Tappable } from '@/components/tappable';

interface ExerciseRowProps {
  name: string;
  /** The line below the name, such as the best set. Without it, the row shows only the name. */
  detail?: string;
  first: boolean;
  last: boolean;
  /** Opens the exercise. Without it, the row only shows it. */
  onPress?: () => void;
}

/** An exercise's best set, for a list. */
export function bestSetText(
  { bestSet }: components['schemas']['ExerciseListItemResponse'],
  units: components['schemas']['Units'],
) {
  return bestSet === null
    ? 'Not done yet'
    : `${formatSet(bestSet.weightKg, bestSet.reps, units)} · ${formatShortDate(bestSet.date)}`;
}

/** A row of a group's card. The first and last rows close the card. */
export function ExerciseRow({
  name,
  detail,
  first,
  last,
  onPress,
}: ExerciseRowProps) {
  const { cardLine, colors, radius, size, space, text } = useTheme();

  return (
    <Tappable
      feedback="fill"
      accessibilityRole={onPress === undefined ? undefined : 'button'}
      disabled={onPress === undefined}
      onPress={onPress}
      style={[
        styles.row,
        {
          borderTopWidth: cardLine,
          borderLeftWidth: cardLine,
          borderRightWidth: cardLine,
          gap: space.md,
          minHeight: size.listRowMin,
          paddingVertical: space.sm,
          paddingHorizontal: space.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderBottomWidth: last ? 1 : 0,
          borderTopLeftRadius: first ? radius.card : 0,
          borderTopRightRadius: first ? radius.card : 0,
          borderBottomLeftRadius: last ? radius.card : 0,
          borderBottomRightRadius: last ? radius.card : 0,
        },
      ]}
    >
      <View style={styles.text}>
        <Text style={[text.listItemName, { color: colors.text }]}>{name}</Text>
        {detail !== undefined && <Text style={text.meta}>{detail}</Text>}
      </View>
      {onPress !== undefined && (
        <ChevronRightIcon color={colors.muted} size={16} />
      )}
    </Tappable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
});
