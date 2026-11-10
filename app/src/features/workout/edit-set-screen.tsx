import { useState } from 'react';

import { useUnits } from '@/features/account/use-units';
import { useExerciseLastTime } from '@/features/exercises/use-exercise-last-time';

import { useDraftChanges, useEditWorkoutDraft } from './edit-workout-draft';
import { findSetEdit, SetEditorPage } from './set-editor';
import type { SetField } from './set-values';

/** A set while editing a saved workout: a change goes into the draft, which Save workout sends. */
export function EditSetScreen({
  exerciseId,
  setId,
  field,
}: {
  exerciseId: string;
  setId: string;
  field: SetField;
}) {
  const { workout, exercises } = useEditWorkoutDraft();
  const { change, removeSet } = useDraftChanges();
  const units = useUnits();
  const [opened] = useState(() =>
    findSetEdit(exercises, exerciseId, setId, field),
  );
  // An exercise added while editing has no last time of its own yet, so it loads, as on the edit page.
  const added = !workout.exercises.some((item) => item.id === exerciseId);
  const lastTime = useExerciseLastTime(
    opened?.exercise.exerciseId ?? '',
    workout.date,
    added && opened !== null,
  );

  if (opened === null) {
    return null;
  }

  const edit = added
    ? {
        ...opened,
        exercise: { ...opened.exercise, lastTime: lastTime.data ?? null },
      }
    : opened;

  return (
    <SetEditorPage
      back="Edit workout"
      edit={edit}
      units={units}
      onSave={(changes, done) => {
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
        done();
      }}
      onRemove={() => {
        removeSet(edit.exercise.id, edit.set.id);
      }}
    />
  );
}
