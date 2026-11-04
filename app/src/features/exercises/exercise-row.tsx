import { StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { ChevronRightIcon } from '@/components/icons';
import { formatSet, formatShortDate } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';
import { Tappable } from '@/components/tappable';

interface ExerciseRowProps {
  exercise: components['schemas']['ExerciseListItemResponse'];
  units: components['schemas']['Units'];
  first: boolean;
  last: boolean;
  /** Opens the exercise. Without it, the row only shows it. */
  onPress?: () => void;
}

/** An exercise's best set, for a list. */
export function bestSetText(
  { bestSet }: ExerciseRowProps['exercise'],
  units: ExerciseRowProps['units'],
) {
  return bestSet === null
    ? 'Not done yet'
    : `${formatSet(bestSet.weightKg, bestSet.reps, units)} · ${formatShortDate(bestSet.date)}`;
}

/** A row of a group's card. The first and last rows close the card. */
export function ExerciseRow({
  exercise,
  units,
  first,
  last,
  onPress,
}: ExerciseRowProps) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <Tappable
      feedback="fill"
      accessibilityRole={onPress === undefined ? undefined : 'button'}
      disabled={onPress === undefined}
      onPress={onPress}
      style={[
        styles.row,
        {
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
        <Text style={[text.listItemName, { color: colors.text }]}>
          {exercise.name}
        </Text>
        <Text style={text.meta}>{bestSetText(exercise, units)}</Text>
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
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
