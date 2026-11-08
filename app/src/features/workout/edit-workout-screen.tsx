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
import {
  dismissAction,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { ScreenHeading } from '@/components/screen-heading';
import { Sheet } from '@/components/sheet';
import { Skeleton } from '@/components/skeleton';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { usePageOptions } from '@/components/use-page-options';
import { useCurrentUser } from '@/features/account/use-current-user';
import { useExerciseLastTime } from '@/features/exercises/use-exercise-last-time';
import { useTheme } from '@/theme/theme-provider';

import { dateFromText, shortWeekdayDate } from './dates';
import {
  EditWorkoutDraftProvider,
  localId,
  useEditWorkoutDraft,
} from './edit-workout-draft';
import { OpenExercise } from './log-exercise';
import { SetEditorSheet, type SetEdit } from './set-sheet';
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
      // A blank line keeps the room for the workout's name while it loads.
      <EditWorkoutPage label=" ">
        {workout.isError ? (
          <LoadFailure
            message="Couldn't load this workout."
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
  /** The workout's name and date. */
  label: string;
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
  const units = useCurrentUser().data?.units ?? 'metric';
  const { workout, exercises, setExercises, setPicked } = useEditWorkoutDraft();
  const save = useEditWorkout(workout.id);
  const [edit, setEdit] = useState<SetEdit | null>(null);
  const [openings, setOpenings] = useState(0);
  const [removing, setRemoving] = useState<WorkoutExercise | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const savedIds = new Set(workout.exercises.map((exercise) => exercise.id));
  const guard = useLeaveGuard(
    JSON.stringify(exercises) !== JSON.stringify(workout.exercises),
  );

  // An Undo can do nothing once the page is gone.
  useEffect(() => dismissAction, []);

  function change(
    exerciseId: string,
    update: (exercise: WorkoutExercise) => WorkoutExercise,
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseId ? update(exercise) : exercise,
      ),
    );
  }

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

  function removeSet(exerciseId: string, setId: string) {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const index = exercise?.sets.findIndex((set) => set.id === setId) ?? -1;
    if (exercise === undefined || index === -1) {
      return;
    }

    const removed = exercise.sets[index];
    change(exerciseId, (current) => ({
      ...current,
      sets: current.sets.filter((set) => set.id !== setId),
    }));
    notifySuccess(`Set ${String(index + 1)} removed.`, {
      label: 'Undo',
      onPress: () => {
        dismissNotification();
        change(exerciseId, (current) => ({
          ...current,
          sets: [
            ...current.sets.slice(0, index),
            removed,
            ...current.sets.slice(index),
          ],
        }));
      },
    });
  }

  function removeExercise(exercise: WorkoutExercise) {
    const index = exercises.indexOf(exercise);
    setExercises((current) => current.filter((kept) => kept !== exercise));
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
          <BottomActionBox aboveTabBar>
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

                dismissNotification();
                guard.allow();
                save.mutate(
                  exercises.map((exercise) => ({
                    id: savedIds.has(exercise.id) ? exercise.id : null,
                    exerciseId: exercise.exerciseId,
                    sets: exercise.sets.map((set) => ({
                      weightKg: set.weightKg,
                      reps: set.reps,
                    })),
                  })),
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
          {edit !== null && (
            <SetEditorSheet
              key={openings}
              edit={edit}
              visible
              units={units}
              saving={false}
              onSave={(changes) => {
                change(edit.exercise.id, (exercise) => ({
                  ...exercise,
                  sets: exercise.sets.map((set) =>
                    set.id === edit.set.id
                      ? {
                          ...set,
                          weightKg: changes.weightKg ?? set.weightKg,
                          reps: changes.reps ?? set.reps,
                        }
                      : set,
                  ),
                }));
                setEdit(null);
              }}
              onRemove={() => {
                removeSet(edit.exercise.id, edit.set.id);
                setEdit(null);
              }}
              onClose={() => {
                setEdit(null);
              }}
            />
          )}
        </>
      }
    >
      {exercises.length === 0 && (
        <View style={{ marginVertical: space.sm }}>
          <EmptyCard
            title="No exercises left"
            message="Add an exercise, or delete the workout instead."
          />
        </View>
      )}
      {exercises.map((exercise) => (
        <EditedExercise
          key={exercise.id}
          workoutId={workout.id}
          before={workout.date}
          added={!savedIds.has(exercise.id)}
          exercise={exercise}
          onEdit={(shown, set, field) => {
            setEdit({
              exercise: shown,
              set,
              index: shown.sets.indexOf(set),
              field,
            });
            setOpenings((count) => count + 1);
          }}
          onAddSet={() => {
            addSet(exercise);
          }}
          onRemove={() => {
            setRemoving(exercise);
            setConfirmingRemove(true);
          }}
        />
      ))}
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
    </EditWorkoutPage>
  );
}

/** An exercise added here loads its own last time, from before the workout's date. */
function EditedExercise({
  workoutId,
  before,
  added,
  exercise,
  onEdit,
  onAddSet,
  onRemove,
}: {
  workoutId: string;
  before: string;
  added: boolean;
  exercise: WorkoutExercise;
  onEdit: (shown: WorkoutExercise, set: WorkoutSet, field: SetField) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  const units = useCurrentUser().data?.units ?? 'metric';
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
      onEdit={(set, field) => {
        onEdit(shown, set, field);
      }}
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
