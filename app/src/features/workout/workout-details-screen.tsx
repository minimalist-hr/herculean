import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { LoadFailure } from '@/components/load-failure';
import { blankLine, ScreenHeading } from '@/components/screen-heading';
import { SectionTitle } from '@/components/section-title';
import { Skeleton } from '@/components/skeleton';
import { useUnits } from '@/features/account/use-units';
import { groupBlocks } from '@/features/routines/group-blocks';
import { GroupStripe } from '@/features/routines/group-stripe';
import {
  formatLastTime,
  noValue,
  shortWeekdayDate,
  weightIn,
  weightUnitOf,
} from '@/formats/formats';
import { tokens } from '@/theme/tokens';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText } from '@/formats/dates';
import { exerciseTotal } from './saved-workout';
import { useWorkout } from './use-workout';
import { useWorkoutSummary } from './use-workout-summary';
import { NewRecords, SummaryTiles } from './workout-summary-parts';
import { usePageEnd } from '@/components/above-tab-bar';

type Exercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutRecord = components['schemas']['WorkoutRecordResponse'];
type Units = components['schemas']['Units'];

/** A quiet line inside an exercise, so it doesn't read as the line between exercises. A view only draws dashes with a border on every side, so all but the top is clipped. */
function DashedLine() {
  const { colors } = useTheme();

  return (
    <View style={styles.dashedLine}>
      <View style={[styles.dashes, { borderColor: colors.border }]} />
    </View>
  );
}

/** One exercise's card while the workout loads, as tall as an exercise with three sets. */
function SavedExercisesSkeleton() {
  const { colors, radius, space } = useTheme();

  return (
    <View
      style={[
        styles.block,
        {
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View style={[styles.rows, { gap: space.sm, padding: space.lg }]}>
        <Skeleton width={180} height={21} />
        <Skeleton width={90} height={17} />
        <DashedLine />
        {[0, 1, 2].map((row) => (
          <View key={row} style={{ paddingVertical: space.sm }}>
            <Skeleton width="100%" height={18} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SetTable({
  exercise,
  record,
  units,
}: {
  exercise: Exercise;
  record?: WorkoutRecord;
  units: Units;
}) {
  const { colors, space, text } = useTheme();
  const recordSet = exercise.sets.find(
    (set) => set.weightKg === record?.weightKg && set.reps === record.reps,
  );

  return (
    <View>
      <View style={[styles.setRow, { gap: space.sm, paddingBottom: space.xs }]}>
        <View style={styles.number} />
        <Text style={[text.dayName, styles.lastTime]}>Last time</Text>
        <Text style={[text.dayName, styles.weight]}>{weightUnitOf(units)}</Text>
        <Text style={[text.dayName, styles.reps]}>Reps</Text>
      </View>
      {exercise.sets.map((set, index) => {
        const last = exercise.lastTime?.sets[index];
        const color = set === recordSet ? colors.primaryText : colors.text;

        return (
          <View
            key={set.id}
            style={[
              styles.setRow,
              {
                gap: space.sm,
                paddingVertical: space.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text
              style={[text.quickPick, styles.number, { color: colors.muted }]}
            >
              {index + 1}
            </Text>
            <Text style={[text.meta, styles.lastTime]}>
              {last === undefined
                ? noValue
                : formatLastTime(last.weightKg, last.reps, units)}
            </Text>
            <Text style={[text.quickPick, styles.weight, { color }]}>
              {set.weightKg === 0 ? noValue : weightIn(set.weightKg, units)}
            </Text>
            <Text style={[text.quickPick, styles.reps, { color }]}>
              {set.reps}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** A saved workout: what it comes to, and every set. */
export function WorkoutDetailsScreen({
  id,
  backLabel = 'Workout',
}: {
  id: string;
  /** The screen it opened from, which the back link is named after. */
  backLabel?: string;
}) {
  const router = useRouter();
  const { colors, radius, size, space, text } = useTheme();
  const pageEnd = usePageEnd();
  const units = useUnits();
  const workout = useWorkout(id);
  const summary = useWorkoutSummary(id);
  // Either call names the workout, so the heading shows with whichever comes first.
  const named = summary.data ?? workout.data;
  // Until a call answers there is nothing to say yet, so the heading holds its room with skeletons.
  const naming =
    named === undefined && (summary.isPending || workout.isPending);

  function headingLabel() {
    if (named !== undefined) {
      return `Done · ${shortWeekdayDate(dateFromText(named.date))}`;
    }

    // A blank line keeps the room after a failure, so the page doesn't move.
    return naming ? null : blankLine;
  }

  function renderSummary() {
    if (summary.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load the summary."
          onRetry={() => {
            void summary.refetch();
          }}
        />
      );
    }

    return (
      <>
        <SummaryTiles summary={summary.data} units={units} saved />
        <NewRecords records={summary.data?.records} units={units} />
      </>
    );
  }

  function renderExercises() {
    if (workout.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load the exercises."
          onRetry={() => {
            void workout.refetch();
          }}
        />
      );
    }

    if (workout.data === undefined) {
      return <SavedExercisesSkeleton />;
    }

    return (
      <View style={{ gap: space.sm }}>
        {groupBlocks(workout.data.exercises).map((block) => {
          const connected = block.length > 1;

          return (
            <View
              key={block[0].id}
              style={[
                styles.block,
                {
                  borderRadius: radius.card,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View style={styles.rows}>
                {block.map((exercise, index) => (
                  <View
                    key={exercise.id}
                    style={{
                      gap: space.sm,
                      padding: space.lg,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View style={[styles.heading, { gap: space.md }]}>
                      <View style={styles.name}>
                        <Text
                          style={[text.listItemName, { color: colors.text }]}
                        >
                          {exercise.name}
                        </Text>
                        {!connected && (
                          <Text style={text.meta}>{exercise.groupName}</Text>
                        )}
                      </View>
                      <Text style={text.meta}>
                        {exerciseTotal(exercise, units)}
                      </Text>
                    </View>
                    <DashedLine />
                    <SetTable
                      exercise={exercise}
                      record={summary.data?.records.find(
                        (record) => record.name === exercise.name,
                      )}
                      units={units}
                    />
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

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        gap: space.lg,
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: pageEnd,
      }}
    >
      <View>
        <BackLink
          label={backLabel}
          onPress={() => {
            router.back();
          }}
        />
        <ScreenHeading
          label={headingLabel()}
          title={naming ? null : (named?.name ?? 'Workout')}
        />
      </View>
      {renderSummary()}
      <View style={{ gap: space.sm }}>
        <SectionTitle>Exercises</SectionTitle>
        {renderExercises()}
      </View>
    </ScrollView>
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
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    gap: tokens.space.xxxs,
  },
  dashedLine: {
    height: 1,
    overflow: 'hidden',
  },
  dashes: {
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  number: {
    width: 24,
  },
  lastTime: {
    flex: 1,
  },
  weight: {
    width: 56,
    textAlign: 'right',
  },
  reps: {
    width: 48,
    textAlign: 'right',
  },
});
