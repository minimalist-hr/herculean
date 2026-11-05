import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { PlusIcon, ReorderIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { ProgressBar } from '@/components/progress-bar';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { sameGroup } from '@/features/routines/formats';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import { ClosedExercise, comesLater, OpenExercise } from './log-exercise';
import { useAddSet } from './use-add-set';
import { SetSheet, type SetEdit } from './set-sheet';
import { useElapsed } from './use-elapsed';
import { useUpdateSet } from './use-update-set';
import { useWorkout } from './use-workout';
import {
  isFinished,
  nextUnfinished,
  workoutProgress,
} from './workout-progress';

type Workout = components['schemas']['WorkoutDetailsResponse'];
type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutSet = components['schemas']['SetResponse'];

/** Logging a workout. Every change saves as it happens, so the back link just leaves. */
export function LogScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const workout = useWorkout(id);

  function renderContent() {
    if (workout.data !== undefined) {
      return <Logging workout={workout.data} />;
    }

    if (workout.isError) {
      return (
        <LoadFailure
          message="Couldn't load this workout."
          onRetry={() => {
            void workout.refetch();
          }}
        />
      );
    }

    return <LoggingSkeleton />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: size.topPaddingSubPage,
        paddingHorizontal: size.sidePadding,
        paddingBottom: size.gap.sectionMax,
      }}
    >
      <BackLink
        label="Workout"
        onPress={() => {
          router.back();
        }}
      />
      {renderContent()}
    </ScrollView>
  );
}

function Heading({ workout }: { workout: Workout }) {
  const { colors, space, text } = useTheme();
  const elapsed = useElapsed(workout.startedAtUtc);
  const { done, total } = workoutProgress(workout.exercises);
  const date = shortWeekdayDate(dateFromText(workout.date));

  return (
    <View style={{ gap: space.sm }}>
      <View style={[styles.titleRow, { gap: space.md }]}>
        <Text
          accessibilityRole="header"
          style={[text.pageTitle, styles.title, { color: colors.text }]}
        >
          {workout.name}
        </Text>
        <Button
          label="Finish"
          onPress={() => {
            comesLater('Finishing a workout');
          }}
        />
      </View>
      <Text style={text.meta}>
        {elapsed === null ? date : `${date} · ${formatClock(elapsed)}`}
      </Text>
      <Text style={text.meta}>
        <Text style={[styles.done, { color: colors.text }]}>
          {String(done)}
        </Text>
        {` of ${String(total)} sets`}
      </Text>
      <ProgressBar done={done} total={total} />
    </View>
  );
}

function Logging({ workout }: { workout: Workout }) {
  const { space } = useTheme();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'metric';
  const updateSet = useUpdateSet(workout.id);
  const addSet = useAddSet(workout.id);
  // Undefined until something is picked: the first unfinished one opens. Null closes them all.
  const [chosenId, setChosenId] = useState<string | null>();
  const [edit, setEdit] = useState<SetEdit | null>(null);
  const [editing, setEditing] = useState(false);
  // Each opening starts the sheet again from the set.
  const [openings, setOpenings] = useState(0);
  const exercises = workout.exercises;
  const openId =
    chosenId === undefined
      ? exercises.find((exercise) => !isFinished(exercise))?.id
      : chosenId;

  function toggle(exercise: WorkoutExercise, set: WorkoutSet) {
    if (updateSet.isPending) {
      return;
    }

    updateSet.mutate(
      {
        workoutExerciseId: exercise.id,
        setId: set.id,
        changes: { checked: !set.checked },
      },
      {
        onSuccess: (sets) => {
          if (sets.every((updated) => updated.checked)) {
            const updated = exercises.map((other) =>
              other.id === exercise.id ? { ...other, sets } : other,
            );
            setChosenId(nextUnfinished(updated, exercise.id)?.id ?? null);
          } else {
            setChosenId(exercise.id);
          }
        },
      },
    );
  }

  return (
    <View style={{ gap: space.lg, marginTop: 2 }}>
      <Heading workout={workout} />

      <View style={{ gap: space.sm }}>
        {exercises.map((exercise, index) => {
          if (exercise.id === openId) {
            return (
              <OpenExercise
                key={exercise.id}
                exercise={exercise}
                units={units}
                adding={addSet.isPending}
                onEdit={(set, field) => {
                  setEdit({
                    exercise,
                    set,
                    index: exercise.sets.indexOf(set),
                    field,
                  });
                  setEditing(true);
                  setOpenings((count) => count + 1);
                }}
                onToggle={(set) => {
                  toggle(exercise, set);
                }}
                onAddSet={() => {
                  addSet.mutate({ workoutExerciseId: exercise.id });
                }}
              />
            );
          }

          const previous = exercises.at(index - 1);
          const next = exercises.at(index + 1);

          return (
            <ClosedExercise
              key={exercise.id}
              exercise={exercise}
              withPrevious={
                index > 0 &&
                previous !== undefined &&
                previous.id !== openId &&
                sameGroup(previous, exercise)
              }
              withNext={
                next !== undefined &&
                next.id !== openId &&
                sameGroup(exercise, next)
              }
              onOpen={() => {
                setChosenId(exercise.id);
              }}
            />
          );
        })}
      </View>

      <View style={[styles.actions, { gap: space.sm }]}>
        <View style={styles.action}>
          <Button
            label="Add exercise"
            variant="secondary"
            icon={PlusIcon}
            onPress={() => {
              comesLater('Adding an exercise');
            }}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Reorder"
            variant="secondary"
            icon={ReorderIcon}
            onPress={() => {
              comesLater('Reordering');
            }}
          />
        </View>
      </View>

      {edit !== null && (
        <SetSheet
          key={openings}
          workoutId={workout.id}
          edit={edit}
          visible={editing}
          units={units}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}
    </View>
  );
}

function LoggingSkeleton() {
  const { colors, radius, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading this workout"
      accessibilityLiveRegion="polite"
      style={{ gap: space.lg, marginTop: 2 }}
    >
      <View style={{ gap: space.sm }}>
        <Skeleton width={220} height={28} />
        <Skeleton width={150} height={10} />
        <Skeleton width={90} height={10} />
      </View>
      <View
        style={[
          styles.skeletonCard,
          {
            gap: space.md,
            padding: space.lg,
            borderRadius: radius.card,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Skeleton width={200} height={16} />
        <Skeleton width={120} height={10} />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} width={280} height={32} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  done: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
  },
  skeletonCard: {
    borderWidth: 1,
  },
});
