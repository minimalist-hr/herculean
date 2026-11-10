import { useState } from 'react';

import { useUnits } from '@/features/account/use-units';

import { findSetEdit, SetEditorPage, type SetEdit } from './set-editor';
import type { SetField } from './set-values';
import { useDeleteSet } from './use-delete-set';
import { useUpdateSet } from './use-update-set';
import { useWorkout } from './use-workout';

/** A set while logging: every change saves to the workout right away. */
export function LogSetScreen({
  id,
  exerciseId,
  setId,
  field,
}: {
  id: string;
  exerciseId: string;
  setId: string;
  field: SetField;
}) {
  const workout = useWorkout(id);
  const units = useUnits();
  const updateSet = useUpdateSet(id);
  const deleteSet = useDeleteSet(id);
  // The set as it was when the page opened, so it stays filled in while it saves.
  const [edit, setEdit] = useState<SetEdit | null>(null);
  const found = findSetEdit(workout.data?.exercises, exerciseId, setId, field);
  if (edit === null && found !== null) {
    setEdit(found);
  }

  if (edit === null) {
    return null;
  }

  return (
    <SetEditorPage
      back="Logging"
      edit={edit}
      units={units}
      saving={updateSet.isPending}
      onSave={(changes, done) => {
        updateSet.mutate(
          { workoutExerciseId: edit.exercise.id, setId: edit.set.id, changes },
          { onSuccess: done },
        );
      }}
      onRemove={() => {
        deleteSet.mutate({
          workoutExerciseId: edit.exercise.id,
          set: edit.set,
        });
      }}
    />
  );
}
