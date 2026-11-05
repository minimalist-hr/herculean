import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/button';
import { PlusIcon, ReorderIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { notifyFailure } from '@/components/notifications';
import { ProgressBar } from '@/components/progress-bar';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { useCurrentUser } from '@/features/account/use-current-user';
import { sameGroup } from '@/features/routines/formats';
import { formatClock } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import { ClosedExercise, comesLater, OpenExercise } from './log-exercise';
import { useAddSet } from './use-add-set';
import { SetSheet, type SetEdit } from './set-sheet';
import { maxExercisesPerWorkout } from './set-values';
import { RestBar, restBarRoom } from './rest-bar';
import { afterCheck, afterUncheck } from './rest-timer';
import { useElapsed } from './use-elapsed';
import { useRemoveExercise } from './use-remove-exercise';
import { useRestTimer } from './use-rest-timer';
import { useWorkoutSettings } from './use-workout-settings';
import { useUpdateSet } from './use-update-set';
import { useWorkout } from './use-workout';
import {
  checkedSets,
  isFinished,
  nextUnfinished,
  workoutProgress,
} from './workout-progress';

type Workout = components['schemas']['WorkoutDetailsResponse'];
type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutSet = components['schemas']['SetResponse'];

/** Until the settings load. A new account starts with the same. */
const startingRestSeconds = 180;

/** Logging a workout. Every change saves as it happens, so the back link just leaves. */
export function LogScreen({ id }: { id: string }) {
  const { colors, size } = useTheme();
  const router = useRouter();
  const workout = useWorkout(id);
  const settings = useWorkoutSettings();
  const { rest, update } = useRestTimer(id);
  // A past day is logged after the fact, so nothing is timed.
  const timed = Boolean(workout.data?.startedAtUtc);

  function onToggled(
    exerciseId: string,
    checked: boolean,
    exercises: WorkoutExercise[],
  ) {
    if (!timed) {
      return;
    }

    const { done, total } = workoutProgress(exercises);
    update((current) => {
      if (!checked) {
        return afterUncheck(current, done > 0);
      }

      return done === total
        ? null
        : afterCheck(
            current,
            exerciseId,
            settings.data?.defaultRestSeconds ?? startingRestSeconds,
          );
    });
  }

  function renderContent() {
    if (workout.data !== undefined) {
      return (
        <Logging
          workout={workout.data}
          onToggled={onToggled}
          onEmptied={() => {
            update(() => null);
          }}
        />
      );
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

  const shownRest = timed ? rest : null;
  const barRoom =
    shownRest === null
      ? 0
      : shownRest.open
        ? restBarRoom.open
        : restBarRoom.hidden;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: size.gap.sectionMax + barRoom,
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
      {shownRest !== null && (
        <RestBar
          rest={shownRest}
          onChange={(next) => {
            update(() => next);
          }}
        />
      )}
    </View>
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
      {total > 0 && (
        <>
          <Text style={text.meta}>
            <Text style={[styles.done, { color: colors.text }]}>
              {String(done)}
            </Text>
            {` of ${String(total)} sets`}
          </Text>
          <ProgressBar done={done} total={total} />
        </>
      )}
    </View>
  );
}

function Logging({
  workout,
  onToggled,
  onEmptied,
}: {
  workout: Workout;
  /** The last exercise was removed. */
  onEmptied: () => void;
  onToggled: (
    exerciseId: string,
    checked: boolean,
    exercises: WorkoutExercise[],
  ) => void;
}) {
  const { space } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const units = user.data?.units ?? 'metric';
  const updateSet = useUpdateSet(workout.id);
  const addSet = useAddSet(workout.id);
  const removeExercise = useRemoveExercise(workout.id);
  const [removing, setRemoving] = useState<WorkoutExercise | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  // Undefined until something is picked: the first unfinished one opens. Null closes them all.
  const [chosenId, setChosenId] = useState<string | null>();
  const [edit, setEdit] = useState<SetEdit | null>(null);
  const [editing, setEditing] = useState(false);
  // Each opening starts the sheet again from the set.
  const [openings, setOpenings] = useState(0);
  const exercises = workout.exercises;
  // An exercise that wasn't here before opens, so what was just added is ready to log.
  const [knownIds, setKnownIds] = useState(() =>
    exercises.map((exercise) => exercise.id),
  );
  const newOne = exercises.find((exercise) => !knownIds.includes(exercise.id));
  if (exercises.length !== knownIds.length || newOne !== undefined) {
    setKnownIds(exercises.map((exercise) => exercise.id));
    if (newOne !== undefined) {
      setChosenId(newOne.id);
    }
  }
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
          onToggled(
            exercise.id,
            !set.checked,
            exercises.map((other) =>
              other.id === exercise.id ? { ...other, sets } : other,
            ),
          );
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

      {exercises.length === 0 && <NoExercises />}

      <View style={{ gap: space.sm }}>
        {exercises.map((exercise, index) => {
          if (exercise.id === openId) {
            return (
              <OpenExercise
                key={exercise.id}
                workoutId={workout.id}
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
                onRemove={() => {
                  setRemoving(exercise);
                  setConfirmingRemove(true);
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
            muted={exercises.length >= maxExercisesPerWorkout}
            onPress={() => {
              if (exercises.length >= maxExercisesPerWorkout) {
                notifyFailure(
                  `A workout can have at most ${String(maxExercisesPerWorkout)} exercises.`,
                );
                return;
              }

              router.push(`/workout/log/${workout.id}/add` as Href);
            }}
          />
        </View>
        {exercises.length > 0 && (
          <View style={styles.action}>
            <Button
              label="Reorder"
              variant="secondary"
              icon={ReorderIcon}
              onPress={() => {
                router.push(`/workout/log/${workout.id}/reorder` as Href);
              }}
            />
          </View>
        )}
      </View>

      {removing !== null && (
        <Sheet
          visible={confirmingRemove}
          title={`Remove ${removing.name}?`}
          message={removeMessageOf(removing)}
          onClose={() => {
            setConfirmingRemove(false);
          }}
        >
          <Button
            label="Remove exercise"
            variant="danger"
            waitingLabel="Removing exercise"
            waiting={removeExercise.isPending}
            onPress={() => {
              removeExercise.mutate(
                { exercise: removing, order: exercises.indexOf(removing) },
                {
                  onSuccess: () => {
                    setConfirmingRemove(false);
                    setChosenId(undefined);
                    if (exercises.length === 1) {
                      onEmptied();
                    }
                  },
                },
              );
            }}
          />
        </Sheet>
      )}

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

/** What removing an exercise takes with it, for example "Its 3 sets, including the one you've logged, will be removed from this workout." */
function removeMessageOf(exercise: WorkoutExercise) {
  const logged = checkedSets(exercise);
  const sets =
    exercise.sets.length === 1
      ? 'Its set'
      : `Its ${String(exercise.sets.length)} sets`;
  const including =
    logged === 0
      ? ''
      : `, including ${logged === 1 ? 'the one' : `the ${String(logged)}`} you've logged,`;

  return `${sets}${including} will be removed from this workout.`;
}

function NoExercises() {
  const { colors, space, text } = useTheme();

  return (
    <View style={[styles.empty, { gap: space.xs, paddingVertical: space.xl }]}>
      <Text style={[text.listItemName, { color: colors.text }]}>
        No exercises left
      </Text>
      <Text style={text.meta}>Add an exercise to keep logging.</Text>
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
  screen: {
    flex: 1,
  },
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
  empty: {
    alignItems: 'center',
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
