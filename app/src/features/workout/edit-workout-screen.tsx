import { Stack, useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { components } from '@/api/schema';
import { BackLink } from '@/components/back-link';
import { BottomActionBox } from '@/components/bottom-action-box';
import { Button } from '@/components/button';
import { EmptyCard } from '@/components/empty-card';
import { PlusIcon } from '@/components/icons';
import { LoadFailure } from '@/components/load-failure';
import { NotLoadedButton } from '@/components/not-loaded-button';
import {
  dismissAction,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { blankLine, ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { FieldSkeleton, Skeleton } from '@/components/skeleton';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { usePageOptions } from '@/components/use-page-options';
import { useUnits } from '@/features/account/use-units';
import { useExerciseLastTime } from '@/features/exercises/use-exercise-last-time';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText } from '@/formats/dates';
import { shortWeekdayDate } from '@/formats/formats';
import {
  EditWorkoutDraftProvider,
  localId,
  useDraftChanges,
  useEditWorkoutDraft,
} from './edit-workout-draft';
import {
  DurationField,
  durationError,
  durationLabel,
  durationMinutes,
  typedDuration,
} from './duration-field';
import {
  inSuperset,
  supersetBlocked,
  supersetBlocks,
  withoutExercise,
} from '@/features/routines/superset-blocks';

import {
  placeIn,
  SupersetBlock,
  type BlockPlace,
} from '@/features/routines/superset-stripe';

import { OpenExercise } from './log-exercise';
import { maxExercisesPerWorkout, type SetField } from './set-values';
import { useEditWorkout } from './use-finish-workout';
import { useWorkout } from './use-workout';

type WorkoutExercise = components['schemas']['WorkoutExerciseResponse'];
type WorkoutSet = components['schemas']['SetResponse'];

/** Loads the saved workout, then keeps it as the draft that the edit pages work on. */
export function EditWorkoutDraft({ id }: { id: string }) {
  const pageOptions = usePageOptions();
  const workout = useWorkout(id);

  if (workout.data === undefined) {
    return (
      <EditWorkoutPage
        // A blank line keeps the room for the workout's name after a failure.
        label={workout.isLoadingError ? blankLine : null}
        after={
          <BottomActionBox>
            <NotLoadedButton label="Save workout" />
          </BottomActionBox>
        }
      >
        {workout.isLoadingError ? (
          <LoadFailure
            message="Couldn’t load this workout."
            onRetry={() => {
              void workout.refetch();
            }}
          />
        ) : (
          <EditWorkoutSkeleton />
        )}
      </EditWorkoutPage>
    );
  }

  return (
    <EditWorkoutDraftProvider workout={workout.data}>
      <Stack screenOptions={pageOptions} />
    </EditWorkoutDraftProvider>
  );
}

/** The page around the edit form, which also shows while the workout loads. */
function EditWorkoutPage({
  label,
  children,
  after,
}: {
  /** The workout's name and date. Null while they load. */
  label: string | null;
  children: ReactNode;
  /** What sits over the scrolling content, such as the bottom box and sheets. */
  after?: ReactNode;
}) {
  const router = useRouter();
  const { colors, size, space } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
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
        <View style={{ marginBottom: space.sm }}>
          <ScreenHeading label={label} title="Edit workout" />
        </View>
        {children}
      </ScrollView>
      {after}
    </View>
  );
}

function EditWorkoutSkeleton() {
  const { colors, radius, space } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel="Loading this workout"
      accessibilityLiveRegion="polite"
    >
      <View style={{ marginVertical: space.sm }}>
        <FieldSkeleton label={durationLabel} optional />
      </View>
      {[0, 1].map((card) => (
        <View
          key={card}
          style={[
            styles.skeletonCard,
            {
              gap: space.md,
              marginVertical: space.sm,
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
            <Skeleton key={row} width="100%" height={32} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** A saved workout's exercises and sets, corrected here and saved together. */
export function EditWorkoutScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const { workout, exercises, setExercises, setPicked } = useEditWorkoutDraft();
  const save = useEditWorkout(workout.id);
  const { change } = useDraftChanges();
  const [removing, setRemoving] = useState<WorkoutExercise | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const savedDuration = typedDuration(workout.durationSeconds);
  const [typed, setTyped] = useState(savedDuration);
  const [typedError, setTypedError] = useState<string>();
  const savedIds = new Set(workout.exercises.map((exercise) => exercise.id));
  const guard = useLeaveGuard(
    typed !== savedDuration ||
      JSON.stringify(exercises) !== JSON.stringify(workout.exercises),
  );

  // An Undo can do nothing once the page is gone.
  useEffect(() => dismissAction, []);

  function addSet(exercise: WorkoutExercise) {
    const last = exercise.sets[exercise.sets.length - 1];
    change(exercise.id, (current) => ({
      ...current,
      sets: [
        ...current.sets,
        { ...last, id: localId(), order: current.sets.length },
      ],
    }));
  }

  function removeExercise(exercise: WorkoutExercise) {
    const index = exercises.indexOf(exercise);
    setExercises((current) =>
      withoutExercise(current, current.indexOf(exercise)),
    );
    notifySuccess(`${exercise.name} removed.`, {
      label: 'Undo',
      onPress: () => {
        dismissNotification();
        setExercises((current) => [
          ...current.slice(0, index),
          exercise,
          ...current.slice(index),
        ]);
      },
    });
  }

  const full = exercises.length >= maxExercisesPerWorkout;

  return (
    <EditWorkoutPage
      label={`${workout.name} · ${shortWeekdayDate(dateFromText(workout.date))}`}
      after={
        <>
          <BottomActionBox>
            <Button
              label="Save workout"
              waitingLabel="Saving workout"
              waiting={save.isPending}
              muted={exercises.length === 0}
              onPress={() => {
                if (exercises.length === 0) {
                  notifyFailure(
                    'Add an exercise to save, or delete the workout.',
                  );
                  return;
                }

                const error = durationError(typed);
                if (error !== undefined) {
                  setTypedError(error);
                  return;
                }

                dismissNotification();
                guard.allow();
                save.mutate(
                  {
                    durationMinutes: durationMinutes(typed),
                    exercises: exercises.map((exercise) => ({
                      id: savedIds.has(exercise.id) ? exercise.id : null,
                      exerciseId: exercise.exerciseId,
                      sets: exercise.sets.map((set) => ({
                        weightKg: set.weightKg,
                        reps: set.reps,
                      })),
                      supersetWithNext: inSuperset(
                        exercise,
                        exercises.at(exercises.indexOf(exercise) + 1),
                      ),
                    })),
                  },
                  { onError: guard.block },
                );
              }}
            />
          </BottomActionBox>
          {guard.sheet}
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
                onPress={() => {
                  setConfirmingRemove(false);
                  removeExercise(removing);
                }}
              />
            </Sheet>
          )}
        </>
      }
    >
      <View style={{ marginVertical: space.sm }}>
        <DurationField
          value={typed}
          error={typedError}
          onChange={(next) => {
            setTyped(next);
            setTypedError(undefined);
          }}
        />
      </View>
      {exercises.length === 0 && (
        <View style={{ marginVertical: space.sm }}>
          <EmptyCard
            title="No exercises left"
            message="Add an exercise, or delete the workout instead."
          />
        </View>
      )}
      {supersetBlocks(exercises).map((block) => {
        const cards = block.map((exercise, row) => {
          const index = exercises.indexOf(exercise);
          const next = exercises.at(index + 1);

          return (
            <EditedExercise
              key={exercise.id}
              place={placeIn(block, row)}
              superset={{
                on: inSuperset(exercise, next),
                unavailable: supersetBlocked(
                  index > 0 ? exercises[index - 1] : undefined,
                  next,
                ),
                onChange: (on) => {
                  setExercises((current) =>
                    current.map((item) =>
                      item.id === exercise.id
                        ? { ...item, supersetWithNext: on }
                        : item,
                    ),
                  );
                },
              }}
              workoutId={workout.id}
              before={workout.date}
              added={!savedIds.has(exercise.id)}
              exercise={exercise}
              onEdit={(set, field) => {
                router.push({
                  pathname: '/workout/edit/[id]/set',
                  params: {
                    id: workout.id,
                    exercise: exercise.id,
                    set: set.id,
                    field,
                  },
                });
              }}
              onAddSet={() => {
                addSet(exercise);
              }}
              onRemove={() => {
                setRemoving(exercise);
                setConfirmingRemove(true);
              }}
            />
          );
        });

        return block.length > 1 ? (
          <SupersetBlock key={block[0].id} open>
            {cards}
          </SupersetBlock>
        ) : (
          cards[0]
        );
      })}
      <View style={{ marginTop: space.lg }}>
        <Button
          label="Add exercise"
          variant="secondary"
          icon={PlusIcon}
          muted={full}
          onPress={() => {
            if (full) {
              notifyFailure(
                `A workout can have at most ${String(maxExercisesPerWorkout)} exercises.`,
              );
              return;
            }

            setPicked([]);
            router.push(`/workout/edit/${workout.id}/add` as Href);
          }}
        />
      </View>
    </EditWorkoutPage>
  );
}

/** An exercise added here loads its own last time, from before the workout's date. */
function EditedExercise({
  place,
  superset,
  workoutId,
  before,
  added,
  exercise,
  onEdit,
  onAddSet,
  onRemove,
}: {
  place: BlockPlace | undefined;
  superset: Parameters<typeof OpenExercise>[0]['superset'];
  workoutId: string;
  before: string;
  added: boolean;
  exercise: WorkoutExercise;
  onEdit: (set: WorkoutSet, field: SetField) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  const units = useUnits();
  const lastTime = useExerciseLastTime(exercise.exerciseId, before, added);
  const shown = added
    ? { ...exercise, lastTime: lastTime.data ?? null }
    : exercise;

  return (
    <OpenExercise
      workoutId={workoutId}
      exercise={shown}
      units={units}
      adding={false}
      canSwap={false}
      place={place}
      superset={superset}
      onEdit={onEdit}
      onAddSet={onAddSet}
      onRemove={onRemove}
    />
  );
}

/** For example "Its 3 sets will be removed from this workout." */
function removeMessageOf(exercise: WorkoutExercise) {
  const sets =
    exercise.sets.length === 1
      ? 'Its set'
      : `Its ${String(exercise.sets.length)} sets`;

  return `${sets} will be removed from this workout.`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  skeletonCard: {
    borderWidth: 1,
  },
});
