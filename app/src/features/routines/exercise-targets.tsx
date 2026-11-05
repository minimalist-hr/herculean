import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { joinedCardStyle } from '@/components/joined-cards';
import { useTheme } from '@/theme/theme-provider';

import { sameGroup, targetText } from './formats';

interface ExerciseTarget {
  exerciseId: string;
  name: string;
  groupId: string;
  groupName: string;
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
}

/** An exercise's name, and its targets and group below. */
export function ExerciseTargetText({
  exercise,
}: {
  exercise: Parameters<typeof targetText>[0] & {
    name: string;
    groupName: string;
  };
}) {
  const { colors, text } = useTheme();

  return (
    <View style={styles.text}>
      <Text style={[text.listItemName, { color: colors.text }]}>
        {exercise.name}
      </Text>
      <ExerciseTargetLine exercise={exercise} />
    </View>
  );
}

/** An exercise's targets and group, for example "3 × 8–10 · Chest". */
export function ExerciseTargetLine({
  exercise,
}: {
  exercise: Parameters<typeof targetText>[0] & { groupName: string };
}) {
  const { colors, text } = useTheme();

  return (
    <Text style={text.meta}>
      <Text style={{ color: colors.primaryText }}>{targetText(exercise)}</Text>
      {` · ${exercise.groupName}`}
    </Text>
  );
}

/** A routine's exercises with their targets. Neighbours in the same group join into one block. */
export function ExerciseTargets({
  exercises,
  background,
  trailing,
}: {
  exercises: ExerciseTarget[];
  /** The rows' fill, when they sit on a card and not on the page. */
  background?: string;
  /** Shows at a row's end, for example how many sets are done. */
  trailing?: (exerciseId: string) => ReactNode;
}) {
  const { colors, radius, size, space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {exercises.map((exercise, index) => (
        <View
          key={exercise.exerciseId}
          style={[
            styles.exercise,
            {
              gap: space.md,
              minHeight: size.listRowMin,
              paddingVertical: space.sm,
              paddingHorizontal: space.lg,
              borderColor: colors.border,
              backgroundColor: background ?? colors.card,
            },
            joinedCardStyle({
              withPrevious:
                index > 0 && sameGroup(exercises[index - 1], exercise),
              withNext:
                index < exercises.length - 1 &&
                sameGroup(exercise, exercises[index + 1]),
              gap: space.sm,
              radius: radius.card,
            }),
          ]}
        >
          <ExerciseTargetText exercise={exercise} />
          {trailing?.(exercise.exerciseId)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
