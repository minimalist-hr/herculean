import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/schema';
import { usePageEnd } from '@/components/above-tab-bar';
import { BackLink } from '@/components/back-link';
import { EmptyCard } from '@/components/empty-card';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { PlusIcon, ReorderIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import { notifyFailure } from '@/components/notifications';
import { ProgressBar } from '@/components/progress-bar';
import { Sheet } from '@/components/sheet';
import {
  Skeleton,
  SkeletonGroup,
  SkeletonLine,
  textLine,
} from '@/components/skeleton';
import { useUnits } from '@/features/account/use-units';
import { useGoBack } from '@/features/home/use-go-back';
import {
  blockAt,
  goesOnToSecond,
  inSuperset,
  nextSupersetSet,
  supersetBlocked,
  supersetBlocks,
} from '@/features/routines/superset-blocks';
import { placeIn, SupersetBlock } from '@/features/routines/superset-stripe';
import { formatClock, shortWeekdayDate } from '@/formats/formats';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText } from '@/formats/dates';
import { ClosedExercise, OpenExercise } from './log-exercise';
import { useAddSet } from './use-add-set';
import { maxExercisesPerWorkout } from './set-values';
import { PartialsBar, RestBar, restBarRoom } from './rest-bar';
import { afterCheck, afterUncheck } from './rest-timer';
import { useElapsed } from './use-elapsed';
import { useChangeLengthenedPartials } from './use-change-lengthened-partials';
import { useChangeSuperset } from './use-change-superset';
import { useRemoveExercise } from './use-remove-exercise';
import { useRestAlert } from './rest-alert';
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
export function LogScreen({
  id,
  openedFromHome = false,
}: {
  id: string;
  openedFromHome?: boolean;
}) {
  const { colors, size } = useTheme();
  const goBack = useGoBack(openedFromHome);
  const workout = useWorkout(id);
  const settings = useWorkoutSettings();
  const { rest, update } = useRestTimer(id);
  useRestAlert(rest?.endsAt ?? null, id);
  const updateSet = useUpdateSet(id);
  // A checked set of an exercise with lengthened partials asks for them before the rest.
  const [partialsDue, setPartialsDue] = useState<{
    workoutExerciseId: string;
    setId: string;
  } | null>(null);
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
          onPartialsDue={(workoutExerciseId, setId) => {
            setPartialsDue({ workoutExerciseId, setId });
          }}
          onEmptied={() => {
            update(() => null);
          }}
        />
      );
    }

    if (workout.isLoadingError) {
      return (
        <LoadFailure
          message="Couldn’t load this workout."
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
    partialsDue !== null
      ? restBarRoom.open
      : shownRest === null
        ? 0
        : shownRest.open
          ? restBarRoom.open
          : restBarRoom.hidden;
  const pageEnd = usePageEnd(barRoom);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: size.topPaddingSubPage,
          paddingHorizontal: size.sidePadding,
          paddingBottom: pageEnd,
        }}
      >
        <BackLink
          label={openedFromHome ? 'Home' : 'Workout'}
          onPress={goBack}
        />
        {renderContent()}
      </ScrollView>
      {partialsDue !== null ? (
        <PartialsBar
          onSkip={() => {
            setPartialsDue(null);
          }}
          onDone={() => {
            updateSet.mutate({
              workoutExerciseId: partialsDue.workoutExerciseId,
              setId: partialsDue.setId,
              changes: { partialsDone: true },
            });
            setPartialsDue(null);
          }}
        />
      ) : (
        shownRest !== null && (
          <RestBar
            rest={shownRest}
            onChange={(next) => {
              update(() => next);
            }}
          />
        )
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
      <Text
        accessibilityRole="header"
        style={[text.pageTitle, { color: colors.text }]}
      >
        {workout.name}
      </Text>
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

function Logging({
  workout,
  onToggled,
  onPartialsDue,
  onEmptied,
}: {
  workout: Workout;
  /** A set was checked on an exercise with lengthened partials. */
  onPartialsDue: (workoutExerciseId: string, setId: string) => void;
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
  const units = useUnits();
  const updateSet = useUpdateSet(workout.id);
  const addSet = useAddSet(workout.id);
  const removeExercise = useRemoveExercise(workout.id);
  const changeSuperset = useChangeSuperset(workout.id);
  const changePartials = useChangeLengthenedPartials(workout.id);
  const [removing, setRemoving] = useState<WorkoutExercise | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  // Undefined until something is picked: the first unfinished one opens. Null closes them all.
  const [chosenId, setChosenId] = useState<string | null>();
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
  // A superset opens whole, with the set to do next marked.
  const openIndex = exercises.findIndex((exercise) => exercise.id === openId);
  const openBlock =
    openIndex === -1
      ? []
      : blockAt(exercises, openIndex).map((index) => exercises[index]);
  const openIds = openBlock.map((exercise) => exercise.id);
  const nextSetId =
    openBlock.length > 1 ? nextSupersetSet(openBlock) : undefined;

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
          if (
            !set.checked &&
            exercise.lengthenedPartials &&
            !set.partialsDone
          ) {
            onPartialsDue(exercise.id, set.id);
          }
          const index = exercises.indexOf(exercise);
          // In a superset, rest comes after a set of each.
          if (
            set.checked ||
            !goesOnToSecond(
              exercise,
              exercise.sets.indexOf(set),
              exercises.at(index + 1),
            )
          ) {
            onToggled(
              exercise.id,
              !set.checked,
              exercises.map((other) =>
                other.id === exercise.id ? { ...other, sets } : other,
              ),
            );
          }
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
    <View style={{ gap: space.lg, marginTop: space.xxxs }}>
      <Heading workout={workout} />

      {exercises.length === 0 && <NoExercises />}

      <View style={{ gap: space.sm }}>
        {supersetBlocks(exercises).map((block) => {
          const open = openIds.includes(block[0].id);
          const cards = block.map((exercise, row) => {
            const index = exercises.indexOf(exercise);
            const next = exercises.at(index + 1);
            const place = placeIn(block, row);

            if (!open) {
              return (
                <ClosedExercise
                  key={exercise.id}
                  exercise={exercise}
                  place={place}
                  onOpen={() => {
                    setChosenId(exercise.id);
                  }}
                />
              );
            }

            return (
              <OpenExercise
                key={exercise.id}
                workoutId={workout.id}
                exercise={exercise}
                place={place}
                nextSetId={nextSetId}
                superset={{
                  on: inSuperset(exercise, next),
                  unavailable: supersetBlocked(
                    index > 0 ? exercises[index - 1] : undefined,
                    next,
                  ),
                  onChange: (on) => {
                    changeSuperset.mutate({
                      workoutExerciseId: exercise.id,
                      supersetWithNext: on,
                    });
                  },
                }}
                partials={{
                  onChange: (on) => {
                    changePartials.mutate({
                      workoutExerciseId: exercise.id,
                      lengthenedPartials: on,
                    });
                  },
                  onToggleSet: (set) => {
                    updateSet.mutate({
                      workoutExerciseId: exercise.id,
                      setId: set.id,
                      changes: { partialsDone: !set.partialsDone },
                    });
                  },
                }}
                units={units}
                adding={addSet.isPending}
                onEdit={(set, field) => {
                  router.push({
                    pathname: '/workout/log/[id]/set',
                    params: {
                      id: workout.id,
                      exercise: exercise.id,
                      set: set.id,
                      field,
                    },
                  });
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
          });

          return block.length > 1 ? (
            <SupersetBlock key={block[0].id} open={open}>
              {cards}
            </SupersetBlock>
          ) : (
            cards[0]
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
        <View style={styles.action}>
          <Button
            label="Reorder"
            variant="secondary"
            icon={ReorderIcon}
            muted={exercises.length < 2}
            onPress={() => {
              if (exercises.length < 2) {
                notifyFailure('Add another exercise first.');
                return;
              }

              router.push(`/workout/log/${workout.id}/reorder` as Href);
            }}
          />
        </View>
      </View>

      <Button
        label="Finish"
        onPress={() => {
          router.push(`/workout/log/${workout.id}/finish` as Href);
        }}
      />

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
                {
                  exercise: removing,
                  order: exercises.indexOf(removing),
                  supersetWithPrevious:
                    exercises.indexOf(removing) > 0 &&
                    exercises.at(exercises.indexOf(removing) - 1)
                      ?.supersetWithNext === true,
                },
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
      : `, including ${logged === 1 ? 'the one' : `the ${String(logged)}`} you’ve logged,`;

  return `${sets}${including} will be removed from this workout.`;
}

function NoExercises() {
  return (
    <EmptyCard
      title="No exercises left"
      message="Add an exercise to keep logging."
    />
  );
}

function LoggingSkeleton() {
  const { space } = useTheme();

  return (
    <View style={{ gap: space.lg, marginTop: space.xxxs }}>
      <View style={{ gap: space.sm }}>
        <SkeletonLine width={220} height={28} lineHeight={textLine.pageTitle} />
        <SkeletonLine width={150} height={10} lineHeight={textLine.meta} />
        <SkeletonLine width={90} height={10} lineHeight={textLine.meta} />
        <ProgressBar done={0} total={0} />
      </View>
      <SkeletonGroup label="Loading this workout">
        <Card>
          <Skeleton width={200} height={16} />
          <Skeleton width={120} height={10} />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} width="100%" height={32} />
          ))}
        </Card>
      </SkeletonGroup>
      <NotLoadedButton label="Finish" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
});
