import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Skeleton, SkeletonLine, textLine } from '@/components/skeleton';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { groupBlocks } from './group-blocks';
import { targetText } from '@/formats/formats';
import { GroupStripe } from './group-stripe';

interface ExerciseTarget {
  exerciseId: string;
  name: string;
  groupId: string;
  groupName: string;
  targetSets: number;
  targetRepsFrom: number;
  targetRepsTo: number;
  /** What was actually done, shown instead of the target once a workout is saved. */
  done?: string;
}

/** An exercise's name, and its targets and group below. In a block, the stripe names the group instead. */
export function ExerciseTargetText({
  exercise,
  showGroup = true,
}: {
  exercise: Parameters<typeof targetText>[0] & {
    name: string;
    groupName: string;
    done?: string;
  };
  showGroup?: boolean;
}) {
  const { colors, text } = useTheme();

  return (
    <View style={styles.text}>
      <Text style={[text.listItemName, { color: colors.text }]}>
        {exercise.name}
      </Text>
      <ExerciseTargetLine exercise={exercise} showGroup={showGroup} />
    </View>
  );
}

/** An exercise's targets and group, for example "3 × 8–10 · Chest". */
export function ExerciseTargetLine({
  exercise,
  showGroup = true,
}: {
  exercise: Parameters<typeof targetText>[0] & {
    groupName: string;
    done?: string;
  };
  showGroup?: boolean;
}) {
  const { colors, text } = useTheme();

  return (
    <Text style={text.meta}>
      <Text style={{ color: colors.primaryText }}>
        {exercise.done ?? targetText(exercise)}
      </Text>
      {showGroup && ` · ${exercise.groupName}`}
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
          <GroupStripe name="" />
        </View>
      ))}
    </View>
  );
}

/** A routine's exercises with their targets. Neighbours in the same group join into one block, with the group up its edge. */
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
      {groupBlocks(exercises).map((block) => {
        const connected = block.length > 1;

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
                <View
                  key={exercise.exerciseId}
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
                  <ExerciseTargetText
                    exercise={exercise}
                    showGroup={!connected}
                  />
                  {trailing?.(exercise.exerciseId)}
                </View>
              ))}
            </View>
            {connected && <GroupStripe name={block[0].groupName} />}
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
