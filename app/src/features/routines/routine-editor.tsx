import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { ApiProblemError, toFormErrors } from '@/api/problem';
import { Button } from '@/components/button';
import { DraggableList } from '@/components/draggable-list';
import { HeaderIconButton } from '@/components/header-icon-button';
import { PlusIcon, TrashIcon } from '@/components/icons';
import {
  dismissNotification,
  notifyFailure,
  notifySuccess,
} from '@/components/notifications';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { useTheme } from '@/theme/theme-provider';

import { ExercisePickerSheet } from './exercise-picker-sheet';
import { counted, targetText } from './formats';
import { TargetsSheet, type Targets } from './targets-sheet';

const routineNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name.')
    .max(100, 'At most 100 characters.'),
});

export interface RoutineExerciseDraft extends Targets {
  exerciseId: string;
  name: string;
}

const startingTargets: Targets = {
  targetSets: 3,
  targetRepsFrom: 8,
  targetRepsTo: 10,
};

interface RoutineEditorProps {
  visible: boolean;
  title: string;
  subtitle: string;
  initialName: string;
  initialExercises: RoutineExerciseDraft[];
  saving: boolean;
  /** Saves the routine. A failure it throws shows on the form. */
  onSave: (name: string, exercises: RoutineExerciseDraft[]) => Promise<unknown>;
  onClose: () => void;
}

/** A sheet with a routine's name and exercises. Nothing is sent until Save routine. */
export function RoutineEditor({
  visible,
  title,
  subtitle,
  initialName,
  initialExercises,
  saving,
  onSave,
  onClose,
}: RoutineEditorProps) {
  const { colors, radius, size, space, text } = useTheme();
  const [exercises, setExercises] = useState(initialExercises);
  const [noExercisesError, setNoExercisesError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickKey, setPickKey] = useState(0);
  const [editing, setEditing] = useState<RoutineExerciseDraft>();
  const [editKey, setEditKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [removing, setRemoving] = useState<RoutineExerciseDraft>();
  const [removeOpen, setRemoveOpen] = useState(false);
  const { control, handleSubmit, setError, formState, getValues } = useForm({
    resolver: zodResolver(routineNameSchema),
    defaultValues: { name: initialName },
  });

  const submit = handleSubmit(
    async ({ name }) => {
      dismissNotification();
      if (exercises.length === 0) {
        setNoExercisesError(true);
        return;
      }

      try {
        await onSave(name, exercises);
      } catch (error) {
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

  function close() {
    dismissNotification();
    onClose();
  }

  const setCount = exercises.reduce(
    (sum, exercise) => sum + exercise.targetSets,
    0,
  );
  const routineName = getValues('name').trim();

  return (
    <>
      <Sheet
        visible={visible}
        title={title}
        message={subtitle}
        onClose={close}
        scrollEnabled={!dragging}
        body={
          <View style={{ gap: space.xl }}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  ref={field.ref}
                  label="Name"
                  placeholder="Chest and arms"
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
              <View style={[styles.sectionTitle, { gap: space.md }]}>
                <View style={styles.sectionText}>
                  <Text style={text.eyebrow}>Exercises</Text>
                  {exercises.length > 0 && (
                    <Text style={text.meta}>
                      {`${counted(exercises.length, 'exercise', 'exercises')} · ${counted(setCount, 'set', 'sets')}`}
                    </Text>
                  )}
                </View>
                <HeaderIconButton
                  label="Add exercise"
                  onPress={() => {
                    setPickKey((key) => key + 1);
                    setPicking(true);
                  }}
                >
                  <PlusIcon color={colors.text} size={20} />
                </HeaderIconButton>
              </View>

              {exercises.length > 0 ? (
                <DraggableList
                  items={exercises}
                  keyOf={(exercise) => exercise.exerciseId}
                  moveLabel={(exercise) => `Move ${exercise.name}`}
                  onDragChange={setDragging}
                  onReorder={setExercises}
                  renderRow={(exercise) => (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${exercise.name}, ${targetText(exercise)}`}
                        onPress={() => {
                          setEditing(exercise);
                          setEditKey((key) => key + 1);
                          setEditOpen(true);
                        }}
                        style={styles.exercise}
                      >
                        <Text
                          numberOfLines={1}
                          style={[text.listItemName, { color: colors.text }]}
                        >
                          {exercise.name}
                        </Text>
                        <Text style={text.meta}>{targetText(exercise)}</Text>
                      </Pressable>
                      <Pressable
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
                        <TrashIcon color={colors.danger} size={20} />
                      </Pressable>
                    </>
                  )}
                />
              ) : (
                <View
                  style={[
                    styles.noExercises,
                    {
                      gap: space.xs,
                      padding: space.xl,
                      borderRadius: radius.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[text.listItemName, { color: colors.text }]}>
                    No exercises yet
                  </Text>
                  <Text style={[text.meta, styles.centered]}>
                    Add the exercises you do in this routine. Sets and reps can
                    be changed for each one.
                  </Text>
                </View>
              )}

              {noExercisesError && (
                <Text style={[text.meta, { color: colors.danger }]}>
                  Add at least one exercise.
                </Text>
              )}
            </View>
          </View>
        }
      >
        <Button
          label="Save routine"
          waitingLabel="Saving routine"
          waiting={saving}
          onPress={() => void submit()}
        />
        <Button
          label="Cancel"
          variant="secondary"
          dimmed={saving}
          onPress={close}
        />
      </Sheet>

      {pickKey > 0 && (
        <ExercisePickerSheet
          key={pickKey}
          visible={picking}
          exclude={exercises.map((exercise) => exercise.exerciseId)}
          onAdd={(picked) => {
            setPicking(false);
            setNoExercisesError(false);
            setExercises((current) => [
              ...current,
              ...picked.map((exercise) => ({
                exerciseId: exercise.id,
                name: exercise.name,
                ...startingTargets,
              })),
            ]);
          }}
          onClose={() => {
            setPicking(false);
          }}
        />
      )}

      {editing !== undefined && (
        <TargetsSheet
          key={editKey}
          visible={editOpen}
          name={editing.name}
          initial={editing}
          onSave={(targets) => {
            setExercises((current) =>
              current.map((exercise) =>
                exercise.exerciseId === editing.exerciseId
                  ? { ...exercise, ...targets }
                  : exercise,
              ),
            );
            setEditOpen(false);
          }}
          onClose={() => {
            setEditOpen(false);
          }}
        />
      )}

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
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => {
              setRemoveOpen(false);
            }}
          />
        </Sheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  noExercises: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centered: {
    textAlign: 'center',
  },
});
