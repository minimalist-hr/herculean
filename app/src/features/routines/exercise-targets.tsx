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

/** A routine's exercises with their targets. Neighbours in the same group join into one block. */
export function ExerciseTargets({
  exercises,
  background,
}: {
  exercises: ExerciseTarget[];
  /** The rows' fill, when they sit on a card and not on the page. */
  background?: string;
}) {
  const { colors, radius, size, space, text } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {exercises.map((exercise, index) => (
        <View
          key={exercise.exerciseId}
          style={[
            styles.exercise,
            {
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
          <Text style={[text.listItemName, { color: colors.text }]}>
            {exercise.name}
          </Text>
          <Text style={text.meta}>
            <Text style={{ color: colors.primaryText }}>
              {targetText(exercise)}
            </Text>
            {` · ${exercise.groupName}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  exercise: {
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
  },
});
