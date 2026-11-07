import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import { EmptyCard } from '@/components/empty-card';
import { Button } from '@/components/button';
import { DraggableList } from '@/components/draggable-list';
import { FormPage } from '@/components/form-page';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PencilIcon, PlusIcon, TrashIcon } from '@/components/icons';
import {
  dismissAction,
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { SectionTitle } from '@/components/section-title';
import { useTheme } from '@/theme/theme-provider';

import { DayChips } from './day-chips';
import { counted, sameGroup, targetText, type Weekday } from './formats';
import { useRoutineDraft, type RoutineExerciseDraft } from './routine-draft';
import { Tappable } from '@/components/tappable';

const routineNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(100, 'At most 100 characters.'),
});

const noDays: Weekday[] = [];

/** The most exercises a routine can hold. */
const maxExercises = 30;

interface RoutineEditorProps {
  /** The screen its back link returns to. */
  back: string;
  title: string;
  subtitle: string;
  initialName: string;
  initialWeekdays?: Weekday[];
  saving: boolean;
  /** Saves the routine. A failure it throws shows on the form. */
  onSave: (
    name: string,
    weekdays: Weekday[],
    exercises: RoutineExerciseDraft[],
  ) => Promise<unknown>;
}

/** A page with a routine's name and exercises. Nothing is sent until Save routine. */
export function RoutineEditor({
  back,
  title,
  subtitle,
  initialName,
  initialWeekdays = noDays,
  saving,
  onSave,
}: RoutineEditorProps) {
  const { colors, opacity, size, space, text } = useTheme();
  const router = useRouter();
  const { pages, exercises, changed, setExercises, setPicked, setCreatedIds } =
    useRoutineDraft();
  const [selectedDays, setSelectedDays] = useState(initialWeekdays);
  const [noExercisesError, setNoExercisesError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState<RoutineExerciseDraft>();
  const [removeOpen, setRemoveOpen] = useState(false);
  const { control, handleSubmit, setError, formState, getValues } = useForm({
    resolver: zodResolver(routineNameSchema),
    defaultValues: { name: initialName },
  });

  const guard = useLeaveGuard(
    formState.isDirty ||
      changed ||
      selectedDays.join() !== initialWeekdays.join(),
  );

  // An Undo can do nothing once the form is gone.
  useEffect(() => dismissAction, []);

  const submit = handleSubmit(
    async ({ name }) => {
      dismissNotification();
      if (exercises.length === 0) {
        setNoExercisesError(true);
        return;
      }

      guard.allow();
      try {
        await onSave(name, selectedDays, exercises);
      } catch (error) {
        guard.block();
        if (
          error instanceof ApiProblemError &&
          error.problem.code === 'routine.limit_reached'
        ) {
          notifyFailure(error.problem.detail);
          return;
        }

        const formErrors = toFormErrors(error, ['name'], {
          'routine.name_taken': 'name',
        });
        if (formErrors.fields.name !== undefined) {
          setError('name', { message: formErrors.fields.name });
        }
        if (formErrors.general) {
          notifyFailure("Couldn't save the routine. Try again.");
        }
      }
    },
    () => {
      setNoExercisesError(exercises.length === 0);
    },
  );

  function remove(exercise: RoutineExerciseDraft) {
    const index = exercises.indexOf(exercise);
    setExercises(exercises.filter((item) => item !== exercise));
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

  const full = exercises.length >= maxExercises;
  const setCount = exercises.reduce(
    (sum, exercise) => sum + exercise.targetSets,
    0,
  );
  const routineName = getValues('name').trim();

  return (
    <>
      <FormPage
        back={back}
        title={title}
        subtitle={subtitle}
        scrollEnabled={!dragging}
        action={
          <Button
            label="Save routine"
            waitingLabel="Saving routine"
            waiting={saving}
            onPress={() => void submit()}
          />
        }
      >
        <View style={{ gap: space.xl }}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                ref={field.ref}
                label="Name"
                autoCapitalize="sentences"
                returnKeyType="done"
                value={field.value}
                onChangeText={(value) => {
                  dismissNotification();
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                error={formState.errors.name?.message}
              />
            )}
          />

          <View style={{ gap: space.sm }}>
            <View style={styles.daysTitle}>
              <SectionTitle>
                Days
                <Text style={[text.meta, styles.optional]}> · optional</Text>
              </SectionTitle>
              <Text style={text.meta}>Picking a day replaces its routine</Text>
            </View>
            <DayChips
              selected={selectedDays}
              onChange={(days) => {
                dismissNotification();
                setSelectedDays(days);
              }}
            />
          </View>

          <View style={{ gap: space.sm }}>
            <View style={[styles.sectionTitle, { gap: space.md }]}>
              <View style={styles.sectionText}>
                <SectionTitle>Exercises</SectionTitle>
                <Text style={text.meta}>
                  {`${counted(exercises.length, 'exercise', 'exercises')} · ${counted(setCount, 'set', 'sets')}`}
                </Text>
              </View>
              <HeaderIconButton
                label={
                  full
                    ? `Add exercise, not available at ${String(maxExercises)} exercises`
                    : 'Add exercise'
                }
                onPress={() => {
                  if (full) {
                    notifyFailure(
                      `A routine can have at most ${String(maxExercises)} exercises.`,
                    );
                    return;
                  }

                  setPicked([]);
                  setCreatedIds([]);
                  router.push(pages.addExercise);
                }}
              >
                <View style={{ opacity: full ? opacity.disabled : 1 }}>
                  <PlusIcon
                    color={full ? colors.muted : colors.text}
                    size={20}
                  />
                </View>
              </HeaderIconButton>
            </View>

            {exercises.length > 0 ? (
              <DraggableList
                items={exercises}
                keyOf={(exercise) => exercise.exerciseId}
                moveLabel={(exercise) => `Move ${exercise.name}`}
                onDragChange={setDragging}
                onReorder={setExercises}
                joined={sameGroup}
                renderRow={(exercise) => (
                  <>
                    <Tappable
                      accessibilityRole="button"
                      accessibilityLabel={`${exercise.name}, ${targetText(exercise)}`}
                      onPress={() => {
                        router.push(pages.targets(exercise.exerciseId));
                      }}
                      style={styles.exercise}
                    >
                      <Text
                        numberOfLines={1}
                        style={[text.listItemName, { color: colors.text }]}
                      >
                        {exercise.name}
                      </Text>
                      <View style={[styles.target, { gap: space.xs }]}>
                        <Text
                          style={[text.meta, { color: colors.primaryText }]}
                        >
                          {targetText(exercise)}
                        </Text>
                        <View testID="edit-targets">
                          <PencilIcon color={colors.primaryText} size={12} />
                        </View>
                        <Text
                          numberOfLines={1}
                          style={[text.meta, styles.group]}
                        >
                          {`· ${exercise.groupName}`}
                        </Text>
                      </View>
                    </Tappable>
                    <Tappable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${exercise.name}`}
                      onPress={() => {
                        setRemoving(exercise);
                        setRemoveOpen(true);
                      }}
                      style={[
                        styles.icon,
                        {
                          width: size.touchTargetMin,
                          height: size.touchTargetMin,
                        },
                      ]}
                    >
                      <TrashIcon color={colors.dangerFill} size={20} />
                    </Tappable>
                  </>
                )}
              />
            ) : (
              <EmptyCard
                title="No exercises yet"
                message="Add the exercises you do in this routine. Sets and reps can be changed for each one."
              />
            )}

            {noExercisesError && exercises.length === 0 && (
              <Text style={[text.meta, { color: colors.danger }]}>
                Add at least one exercise.
              </Text>
            )}
          </View>
        </View>
      </FormPage>
      {guard.sheet}

      {removing !== undefined && (
        <Sheet
          visible={removeOpen}
          title={`Remove ${removing.name}?`}
          message={`It’s removed from ${routineName === '' ? 'this routine' : routineName}, with its ${targetText(removing)} target. Workouts you already logged stay.`}
          onClose={() => {
            setRemoveOpen(false);
          }}
        >
          <Button
            label="Remove exercise"
            variant="danger"
            onPress={() => {
              setRemoveOpen(false);
              remove(removing);
            }}
          />
        </Sheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  target: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  group: {
    flexShrink: 1,
  },
  daysTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  optional: {
    textTransform: 'none',
    letterSpacing: 0,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionText: {
    flex: 1,
    gap: 2,
  },
  exercise: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    alignSelf: 'stretch',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
