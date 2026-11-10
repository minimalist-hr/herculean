import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Skeleton, SkeletonLine, textLine } from '@/components/skeleton';
import { Tappable } from '@/components/tappable';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { targetText } from '@/formats/formats';
import { supersetBlocks } from './superset-blocks';
import { SupersetStripe } from './superset-stripe';

interface ExerciseTarget {
  exerciseId: string;
  name: string;
  groupId: string;
  groupName: string;
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
  /** Done as a superset with the exercise after it. */
  supersetWithNext: boolean;
  /** What was actually done, shown instead of the target once a workout is saved. */
  done?: string;
  /** False once the exercise is deleted, so its row opens nothing. */
  exists?: boolean;
}

/** An exercise's name, and its targets and group below. */
export function ExerciseTargetText({
  exercise,
}: {
  exercise: Parameters<typeof targetText>[0] & {
    name: string;
    groupName: string;
    done?: string;
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
  exercise: Parameters<typeof targetText>[0] & {
    groupName: string;
    done?: string;
  };
}) {
  const { colors, text } = useTheme();

  return (
    <Text style={text.meta}>
      <Text style={{ color: colors.primaryText }}>
        {exercise.done ?? targetText(exercise)}
      </Text>
      {` · ${exercise.groupName}`}
    </Text>
  );
}

/** Exercise targets while they load in a sheet: one row, as wide as the sheet. A sheet is short, so it needn't match the list's height. */
export function ExerciseTargetsSkeleton() {
  const { size } = useTheme();

  return <Skeleton width="100%" height={size.listRowMin} />;
}

/** How many rows each block of a typical day has while it loads. */
const skeletonBlocks = [2, 3, 2];

/** A day's exercises while they load, in blocks the size of a typical day. */
export function ExerciseBlocksSkeleton({ background }: { background: string }) {
  const { colors, radius, size, space } = useTheme();

  return (
    <View style={{ gap: space.sm }}>
      {skeletonBlocks.map((rows, block) => (
        <View
          key={block}
          style={[
            styles.block,
            {
              borderRadius: radius.card,
              borderColor: colors.border,
              backgroundColor: background,
            },
          ]}
        >
          <View style={styles.rows}>
            {Array.from({ length: rows }, (_, row) => (
              <View
                key={row}
                style={[
                  styles.exercise,
                  {
                    minHeight: size.listRowMin,
                    paddingVertical: space.sm,
                    paddingHorizontal: space.lg,
                    borderTopWidth: row === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  },
                ]}
              >
                <View style={styles.text}>
                  <SkeletonLine
                    width={170}
                    height={14}
                    lineHeight={textLine.listItemName}
                  />
                  <SkeletonLine
                    width={70}
                    height={10}
                    lineHeight={textLine.meta}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** A routine's exercises with their targets. A superset's two exercises join into one block, marked up its edge. */
export function ExerciseTargets({
  exercises,
  background,
  trailing,
  onOpen,
}: {
  exercises: ExerciseTarget[];
  /** The rows' fill, when they sit on a card and not on the page. */
  background?: string;
  /** Shows at a row's end, for example how many sets are done. */
  trailing?: (exerciseId: string) => ReactNode;
  /** Opens an exercise. Its row then has a chevron. */
  onOpen?: (exerciseId: string) => void;
}) {
  const { colors, radius, size, space } = useTheme();
  const opens = (exercise: ExerciseTarget) =>
    onOpen !== undefined && exercise.exists !== false;

  return (
    <View style={{ gap: space.sm }}>
      {supersetBlocks(exercises).map((block) => {
        const superset = block.length > 1;

        return (
          <View
            key={block[0].exerciseId}
            style={[
              styles.block,
              {
                borderRadius: radius.card,
                borderColor: colors.border,
                backgroundColor: background ?? colors.card,
              },
            ]}
          >
            <View style={styles.rows}>
              {block.map((exercise, index) => (
                <Tappable
                  key={exercise.exerciseId}
                  feedback="fill"
                  accessibilityRole={opens(exercise) ? 'button' : undefined}
                  accessibilityLabel={exercise.name}
                  disabled={!opens(exercise)}
                  onPress={() => {
                    onOpen?.(exercise.exerciseId);
                  }}
                  style={[
                    styles.exercise,
                    {
                      gap: space.md,
                      minHeight: size.listRowMin,
                      paddingVertical: space.sm,
                      paddingHorizontal: space.lg,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <ExerciseTargetText exercise={exercise} />
                  {trailing?.(exercise.exerciseId)}
                  {opens(exercise) && (
                    <ChevronRightIcon color={colors.muted} size={16} />
                  )}
                </Tappable>
              ))}
            </View>
            {superset && <SupersetStripe />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  rows: {
    flex: 1,
  },
  exercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
});
